<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

// 1. Quản lý trạng thái thời gian
const currentTime = ref(new Date());
let timer;

const products = ref([]);
const customers = ref([]);
const vouchers = ref([]);
const applicableVouchers = ref([]);
const paymentMethods = ref([]);
const invoices = ref([]);
const activeInvoiceIndex = ref(0);
const manualVoucherCode = ref('');

const formatDateTime = (date) => {
  return date.toLocaleString('vi-VN');
};

const normalizeCustomer = (customer) => {
  if (!customer) return null;

  return {
    ...customer,
    id: customer.id ?? null,
    name: customer.name ?? customer.hoTen ?? '',
    phone: customer.phone ?? customer.soDienThoai ?? '',
    type: customer.type ?? customer.vaiTro?.tenVaiTro ?? 'Khach hang'
  };
};

const getCustomerId = (customer) => {
  const parsedId = Number(customer?.id);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
};

const getApiErrorMessage = (error, fallbackMessage) => {
  return error?.response?.data?.error || error?.response?.data?.message || fallbackMessage;
};

const fetchInitialData = async () => {
  try {
    invoices.value = []; // Clear current invoices to avoid duplication
    const [prodRes, custRes, vouchRes, ptttRes, invRes] = await Promise.all([
      axios.get('http://localhost:8080/api/admin/products'),
      axios.get('http://localhost:8080/api/admin/users'),
      axios.get('http://localhost:8080/api/admin/vouchers'),
      axios.get('http://localhost:8080/api/admin/payment-methods'),
      axios.get('http://localhost:8080/api/admin/pos/invoices')
    ]);
    
    products.value = prodRes.data.map(p => ({
      id: p.id,
      name: p.tenSanPham,
      price: p.giaSauGiam || p.giaGoc,
      originalPrice: p.giaGoc,
      hasPromotion: (p.giaSauGiam && p.giaSauGiam < p.giaGoc),
      ma: p.ma,
      img: (p.hinhAnhs && p.hinhAnhs.length > 0) ? p.hinhAnhs[0].url : 'https://via.placeholder.com/50' 
    }));
    
    customers.value = custRes.data.map(normalizeCustomer);
    vouchers.value = vouchRes.data;
    paymentMethods.value = ptttRes.data;
    
    // Load waiting invoices (Carts)
    if (invRes.data && invRes.data.length > 0) {
      for (const inv of invRes.data) {
        const detailRes = await axios.get(`http://localhost:8080/api/admin/pos/invoices/${inv.id}`);
        const data = detailRes.data;
        
        console.log("DỮ LIỆU GIỎ HÀNG TỪ BACKEND TRẢ VỀ LÀ:", data.items);

        const cartItems = data.items || [];
        const summary = computeInvoiceSummary({ voucher: null }, cartItems);
        invoices.value.push({
          id: data.bill.id,
          code: data.bill.ma,
          cart: cartItems,
          customer: normalizeCustomer(data.bill.nguoiDung),
          voucher: null,
          subTotal: summary.subTotal,
          discount: summary.discount,
          total: summary.total
        });
      }
    }

    if (invoices.value.length > 0) {
      await loadApplicableVouchers(invoices.value[activeInvoiceIndex.value]?.id);
    }
  } catch (error) {
    console.error("Error fetching POS data:", error);
  }
};

onMounted(() => {
  fetchInitialData();
  timer = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});

import { watch } from 'vue';
watch(activeInvoiceIndex, async (newVal) => {
  const inv = invoices.value[newVal];
  if (inv) {
    await loadApplicableVouchers(inv.id);
    manualVoucherCode.value = inv.voucher?.maCode || '';
  } else {
    applicableVouchers.value = [];
    manualVoucherCode.value = '';
  }
});

const activeInvoice = computed(() => invoices.value[activeInvoiceIndex.value] || null);

const loadApplicableVouchers = async (invoiceId) => {
  if (!invoiceId) {
    applicableVouchers.value = [];
    return;
  }

  try {
    const res = await axios.get(`http://localhost:8080/api/admin/pos/invoices/${invoiceId}/applicable-vouchers`);
    applicableVouchers.value = res.data || [];
    
    const currentInv = invoices.value[activeInvoiceIndex.value];
    if (currentInv && currentInv.voucher) {
      if (!applicableVouchers.value.find(v => v.maCode === currentInv.voucher.maCode)) {
        currentInv.voucher = null;
        ElMessage.warning('Voucher hiện tại không còn hiệu lực cho đơn hàng này.');
        await refreshActiveInvoice();
      }
    }
  } catch (error) {
    console.error("Lỗi khi lấy voucher áp dụng:", error);
    applicableVouchers.value = [];
  }
}

// Variant selection modal state
const variantModalVisible = ref(false);
const voucherModalVisible = ref(false);
const selectedProduct = ref(null);
const variantOptions = ref([]);
const selectedVariant = ref(null);
const variantQuantity = ref(1);

const openVoucherModal = () => {
  voucherModalVisible.value = true;
};

const showAlert = (message) => {
  ElMessage.warning(message);
};

const handleVoucherClick = (v) => {
  if (applicableVouchers.value.find(av => av.id === v.id)) {
    selectVoucher(v);
    voucherModalVisible.value = false;
  } else {
    showAlert('Đơn hàng không đủ điều kiện áp dụng Voucher này!');
  }
};

const computeVoucherDiscount = (voucher, baseAmount) => {
  if (!voucher || !voucher.kieuGiamGia) return 0;
  if (voucher.kieuGiamGia === 'PERCENT') {
    return (baseAmount * (voucher.giaTriGiam || 0)) / 100;
  }
  return voucher.giaTriGiam || 0;
};

const computeInvoiceSummary = (invoice, cartItems) => {
  // 1. Tính tổng tiền gốc của các sản phẩm (Chưa trừ bất kỳ khuyến mãi nào)
  const originalTotal = cartItems.reduce((sum, item) => {
    const basePrice = Number(item.sanPhamChiTiet?.giaBan || 0);
    return sum + basePrice * Number(item.soLuong || 0);
  }, 0);
  
  // 2. Tính tổng tiền sau khi đã áp dụng Khuyến mãi sản phẩm (donGia là giá đã giảm từ Backend)
  const discountedSubTotal = cartItems.reduce((sum, item) => {
    const currentPrice = Number(item.donGia || 0);
    return sum + currentPrice * Number(item.soLuong || 0);
  }, 0);

  // 3. Giảm giá từ sản phẩm = Tổng gốc - Tổng sau giảm SP
  const itemDiscount = Math.max(0, originalTotal - discountedSubTotal);

  // 4. Tính toán giảm giá từ Voucher (áp dụng trên discountedSubTotal)
  let voucherDiscount = 0;
  if (invoice?.voucher && discountedSubTotal > 0) {
    voucherDiscount = computeVoucherDiscount(invoice.voucher, discountedSubTotal);
    if (invoice.voucher.giaTriGiamToiDa) {
      voucherDiscount = Math.min(voucherDiscount, Number(invoice.voucher.giaTriGiamToiDa));
    }
    voucherDiscount = Math.min(voucherDiscount, discountedSubTotal);
  }

  // 5. Tổng giảm giá = Khuyến mãi sản phẩm + Voucher
  const totalDiscount = Math.max(0, itemDiscount + voucherDiscount);
  // 6. Tổng thanh toán cuối cùng
  const total = Math.max(0, discountedSubTotal - voucherDiscount);
  
  return {
    subTotal: originalTotal, // Hiển thị Tạm tính là giá gốc
    discount: totalDiscount, // Hiển thị tổng số tiền được giảm
    total: total             // Số tiền thực tế khách phải trả
  };
};

const addInvoice = async () => {
  if (invoices.value.length >= 5) {
    ElMessage.warning('Chỉ có thể tạo tối đa 5 hóa đơn chờ!');
    return;
  }

  try {
    const res = await axios.post('http://localhost:8080/api/admin/pos/invoices');
    const newInvData = res.data;
    
    const newInv = {
      id: newInvData.id,
      code: newInvData.ma,
      cart: [],
      customer: normalizeCustomer(newInvData.nguoiDung),
      voucher: null,
      subTotal: 0,
      discount: 0,
      total: 0
    };
    
    invoices.value.push(newInv);
    activeInvoiceIndex.value = invoices.value.length - 1;
    await loadApplicableVouchers(newInv.id);
  } catch (error) {
    console.error("Lỗi khi tạo hóa đơn mới:", error);
  }
};

const refreshActiveInvoice = async () => {
  if (!activeInvoice.value || !activeInvoice.value.id) return;
  try {
    const res = await axios.get(`http://localhost:8080/api/admin/pos/invoices/${activeInvoice.value.id}`);
    const data = res.data;
    const index = activeInvoiceIndex.value;
    
    const cartItems = data.items || [];
    const summary = computeInvoiceSummary({ voucher: invoices.value[index]?.voucher }, cartItems);

    // Update reactivity correctly
    const currentVoucher = invoices.value[index]?.voucher || null;
    const updatedInvoice = {
      ...invoices.value[index],
      id: data.bill.id,
      code: data.bill.ma,
      cart: cartItems,
      customer: normalizeCustomer(data.bill.nguoiDung),
      voucher: currentVoucher,
      ...computeInvoiceSummary({ voucher: currentVoucher }, cartItems)
    };
    invoices.value[index] = updatedInvoice;
    manualVoucherCode.value = currentVoucher?.maCode || '';
    await loadApplicableVouchers(updatedInvoice.id);
  } catch (error) {
    console.error("Error refreshing invoice:", error);
  }
};

const openVariantModal = async (product) => {
  if (!activeInvoice.value) {
    ElMessage.warning("Vui lòng tạo hóa đơn mới để bắt đầu!");
    return;
  }

  try {
    const detailRes = await axios.get(`http://localhost:8080/api/admin/products/${product.id}`);
    const details = detailRes.data.details || [];
    if (details.length === 0) {
      ElMessage.warning("Sản phẩm này hiện không có biến thể nào khả dụng!");
      return;
    }

    selectedProduct.value = product;
    variantOptions.value = details;
    selectedVariant.value = details.find(d => d.soLuong > 0) || details[0];
    variantQuantity.value = 1;
    variantModalVisible.value = true;
  } catch (error) {
    console.error("Lỗi khi lấy biến thể sản phẩm:", error);
    ElMessage.error(error.response?.data?.message || "Lỗi khi tải chi tiết sản phẩm");
  }
};

const addToCart = (product) => {
  openVariantModal(product);
};

const addToCartSelectedVariant = async () => {
  if (!activeInvoice.value || !selectedVariant.value) return;

  if (variantQuantity.value < 1) {
    ElMessage.warning("Số lượng phải lớn hơn 0");
    return;
  }

  try {
    await axios.post(`http://localhost:8080/api/admin/pos/invoices/${activeInvoice.value.id}/details`, null, {
      params: {
        spctId: selectedVariant.value.id,
        quantity: variantQuantity.value
      }
    });

    variantModalVisible.value = false;
    await refreshActiveInvoice();
    search.value = '';
  } catch (error) {
    console.error("Lỗi khi thêm biến thể vào hóa đơn:", error);
    ElMessage.error(error.response?.data?.message || "Lỗi khi thêm biến thể vào giỏ hàng");
  }
};

const updateQuantity = async (detailId, quantity) => {
  // 1. In ra xem nút bấm có lấy được ID chưa?
  console.log("=== TEST NÚT BẤM ===");
  console.log("ID Chi tiết đang truyền vào:", detailId);
  console.log("Số lượng muốn đổi thành:", quantity);

  // Nếu detailId bị undefined, tức là HTML bạn truyền sai tên biến ID
  if (!detailId) {
    ElMessage.error("LỖI FRONTEND: detailId bị undefined! Hãy kiểm tra lại biến item.idGhct trong HTML xem có đúng không. Có thể nó là item.id?");
    return;
  }

  if (quantity < 1) {
    await removeFromCart(detailId);
    return;
  }

  try {
    // 2. Gọi API
    console.log(`Đang gọi API: PUT http://localhost:8080/api/admin/pos/details/${detailId}/quantity?quantity=${quantity}`);
    
    await axios.put(`http://localhost:8080/api/admin/pos/details/${detailId}/quantity`, null, {
      params: { quantity: quantity } // Đảm bảo truyền đúng key
    });
    
    await refreshActiveInvoice();
    console.log("Cập nhật thành công!");
    
  } catch (error) {
    // 3. Nếu lỗi, in thẳng lỗi Backend ra màn hình
    console.error("LỖI API BACKEND:", error);
    ElMessage.error("Lỗi Backend: " + (error.response?.data?.message || error.message));
  }
};

const removeFromCart = async (detailId) => {
  try {
    await axios.delete(`http://localhost:8080/api/admin/pos/details/${detailId}`);
    await refreshActiveInvoice();
  } catch (error) {
    ElMessage.error("Lỗi khi xóa sản phẩm!");
  }
};

const selectCustomer = async (customer) => {
  try {
    const customerId = getCustomerId(customer);
    if (!customerId) {
      ElMessage.error("Khach hang khong hop le!");
      return;
    }

    await axios.put(`http://localhost:8080/api/admin/pos/invoices/${activeInvoice.value.id}/customer`, null, {
      params: { customerId }
    });
    await refreshActiveInvoice();
    customerSearch.value = '';
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "Loi khi chon khach hang!"));
  }
};

const selectVoucher = async (voucher) => {
  try {
    if (!activeInvoice.value) return;

    const code = typeof voucher === 'string' ? voucher : voucher?.maCode;

    if (!code) {
      activeInvoice.value.voucher = null;
      manualVoucherCode.value = '';
      await axios.put(`http://localhost:8080/api/admin/pos/invoices/${activeInvoice.value.id}/voucher`, null, {
        params: { voucherCode: '' }
      });
      const details = computeInvoiceSummary(activeInvoice.value, activeInvoice.value.cart || []);
      activeInvoice.value.subTotal = details.subTotal;
      activeInvoice.value.discount = details.discount;
      activeInvoice.value.total = details.total;
      return;
    }

    const foundVoucher = applicableVouchers.value.find(v => v.maCode === code) || 
                       vouchers.value.find(v => v.maCode === code);

    if (!foundVoucher) {
      ElMessage.error('Voucher khong ton tai hoac khong hop le');
      return;
    }

    if (!applicableVouchers.value.some(v => v.maCode === code)) {
      ElMessage.warning('Don hang chua dat dieu kien ap dung voucher nay');
      return;
    }

    await axios.put(`http://localhost:8080/api/admin/pos/invoices/${activeInvoice.value.id}/voucher`, null, {
      params: { voucherCode: code }
    });

    activeInvoice.value.voucher = foundVoucher;
    manualVoucherCode.value = code;
    const details = computeInvoiceSummary(activeInvoice.value, activeInvoice.value.cart || []);
    activeInvoice.value.subTotal = details.subTotal;
    activeInvoice.value.discount = details.discount;
    activeInvoice.value.total = details.total;
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, 'Loi khi ap dung voucher!'));
  }
};
const confirmPayment = async () => {
  if (!activeInvoice.value || activeInvoice.value.cart.length === 0) return;
  
  // Find payment method ID from paymentMethods list based on selectedPaymentMethod
  // This assumes the backend returns payment methods with specific names or codes
  // For now, if no matching ID found, use the first one available
  let ptttId = paymentMethods.value[0]?.id;
  if (selectedPaymentMethod.value === 'CASH') {
    ptttId = paymentMethods.value.find(p => p.ten?.toLowerCase().includes('tiền mặt'))?.id || ptttId;
  } else {
    ptttId = paymentMethods.value.find(p => p.ten?.toLowerCase().includes('chuyển khoản'))?.id || ptttId;
  }

  try {
    await ElMessageBox.confirm(
      'Xác nhận đặt hàng và thanh toán hóa đơn này?',
      'Xác nhận thanh toán',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning',
      }
    );

    if (!ptttId) {
      ElMessage.error("Không tìm thấy phương thức thanh toán hợp lệ.");
      return;
    }

    const customerId = getCustomerId(activeInvoice.value.customer);
    const params = {
      paymentMethodId: ptttId,
      note: selectedPaymentMethod.value === 'CASH' ? "Thanh toán tiền mặt tại quầy" : "Thanh toán chuyển khoản VietQR"
    };

    if (activeInvoice.value.voucher?.maCode) {
      params.voucherCode = activeInvoice.value.voucher.maCode;
    }

    if (customerId) {
      params.customerId = customerId;
    }

    console.log("TIẾN HÀNH THANH TOÁN CHO KHÁCH HÀNG ID:", customerId);
    await axios.post(`http://localhost:8080/api/admin/pos/invoices/${activeInvoice.value.id}/checkout`, null, { params });
    ElMessage.success("Thanh toán thành công!");
    showPaymentModal.value = false;
    invoices.value.splice(activeInvoiceIndex.value, 1);
    activeInvoiceIndex.value = Math.max(0, invoices.value.length - 1);
  } catch (error) {
    if (error !== 'cancel') {
      console.error("Lỗi thanh toán POS:", error?.response?.data || error);
      ElMessage.error(getApiErrorMessage(error, "Thanh toán thất bại!"));
    }
  }
};
const removeInvoice = async (index) => {
  const inv = invoices.value[index];
  if (!inv) return;

  try {
    await ElMessageBox.confirm(
      'Bạn có chắc muốn đóng hóa đơn này?',
      'Xác nhận xóa',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy bỏ',
        type: 'warning',
      }
    );

    if (inv.id) {
      console.log("Đang xóa hóa đơn chờ với ID:", inv.id);
      const response = await axios.delete(`http://localhost:8080/api/admin/pos/invoices/${inv.id}`);
      
      if (response.status === 200) {
        invoices.value.splice(index, 1);
        if (activeInvoiceIndex.value >= invoices.value.length) {
          activeInvoiceIndex.value = Math.max(0, invoices.value.length - 1);
        }
        ElMessage.success("Xóa thành công");
      }
    } else {
      // Trường hợp hóa đơn chưa có ID (vừa tạo ở front mà chưa lưu - nếu có)
      invoices.value.splice(index, 1);
      if (activeInvoiceIndex.value >= invoices.value.length) {
        activeInvoiceIndex.value = Math.max(0, invoices.value.length - 1);
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error("Lỗi khi xóa hóa đơn:", error);
      ElMessage.error("Không thể xóa hóa đơn này khỏi hệ thống. Vui lòng thử lại!");
    }
  }
};

// 5. Tìm kiếm
const search = ref('');
const showAddCustomerModal = ref(false);
const newCustomer = ref({ hoTen: '', soDienThoai: '' });
const selectedPaymentMethod = ref('CASH'); // 'CASH' or 'TRANSFER'
const showPaymentModal = ref(false);
const customerCash = ref(0);
const bankInfo = {
  bankId: 'TPBANK',
  accountNo: '99435174999',
  accountName: 'NGO THUY LINH'
};

const changeAmount = computed(() => {
  if (!activeInvoice.value) return 0;
  return Math.max(0, (customerCash.value || 0) - activeInvoice.value.total);
});

const suggestedCashAmounts = computed(() => {
  if (!activeInvoice.value) return [];
  const total = activeInvoice.value.total;
  const amounts = new Set([total]);
  
  const roundingLevels = [10000, 20000, 50000, 100000, 200000, 500000, 1000000];
  roundingLevels.forEach(level => {
    const rounded = Math.ceil(total / level) * level;
    if (rounded >= total) amounts.add(rounded);
  });
  
  return Array.from(amounts).sort((a, b) => a - b).slice(0, 6);
});

const openPaymentModal = () => {
  if (!activeInvoice.value || activeInvoice.value.cart.length === 0) return;
  customerCash.value = activeInvoice.value.total;
  showPaymentModal.value = true;
};

const vietQrUrl = computed(() => {
  if (!activeInvoice.value) return '';
  return `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${activeInvoice.value.total}&addInfo=${encodeURIComponent('Thanh toan hoa don ' + activeInvoice.value.code)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;
});
const filteredProducts = computed(() => {
  if (!products.value) return [];
  const s = search.value?.toLowerCase() || '';
  return products.value.filter(p => 
    p.name?.toLowerCase().includes(s) || 
    p.ma?.toLowerCase().includes(s) ||
    `SP00${p.id}`.toLowerCase().includes(s)
  );
});

const customerSearch = ref('');
const filteredCustomers = computed(() => {
  if (!customerSearch.value) return [];
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(customerSearch.value.toLowerCase()) || 
    c.phone.includes(customerSearch.value)
  );
});

const handleQuickAddCustomer = async () => {
  if (!newCustomer.value.hoTen || !newCustomer.value.soDienThoai) {
    ElMessage.warning("Vui long nhap day du ho ten va so dien thoai!");
    return;
  }

  const phoneRegex = /^(0|84)[0-9]{9}$/;
  if (!phoneRegex.test(newCustomer.value.soDienThoai)) {
    ElMessage.warning("So dien thoai khong dung dinh dang!");
    return;
  }

  try {
    const res = await axios.post('http://localhost:8080/api/admin/pos/quick-customer', null, {
      params: {
        hoTen: newCustomer.value.hoTen,
        soDienThoai: newCustomer.value.soDienThoai
      }
    });

    const formattedCustomer = normalizeCustomer(res.data);

    if (!customers.value.find(c => c.id === formattedCustomer.id)) {
      customers.value.push(formattedCustomer);
    }

    if (activeInvoice.value) {
      await selectCustomer(formattedCustomer);
    }

    ElMessage.success("Them khach hang thanh cong!");
    showAddCustomerModal.value = false;
    newCustomer.value = { hoTen: '', soDienThoai: '' };
  } catch (error) {
    console.error("Loi khi them khach hang nhanh:", error);
    ElMessage.error(getApiErrorMessage(error, "Loi khi them khach hang!"));
  }
};
</script>

<template>
  <div class="pos-view container-fluid p-4">
    <!-- Header: Nút quay lại và Tiêu đề -->
    <div class="d-flex align-items-center mb-4">
      <button @click="router.back()" class="btn btn-white shadow-sm rounded-circle me-3">
        <i class="fas fa-arrow-left text-secondary"></i>
      </button>
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1">
            <li class="breadcrumb-item small">
              <router-link to="/admin" class="text-decoration-none text-muted">Trang chủ</router-link>
            </li>
            <li class="breadcrumb-item small active" aria-current="page">Bán hàng tại quầy</li>
          </ol>
        </nav>
        <h4 class="fw-bold mb-0 text-dark">BÁN HÀNG TẠI QUẦY</h4>
      </div>
    </div>

    <!-- Màn hình trống khi chưa có hóa đơn -->
    <div v-if="invoices.length === 0" class="d-flex flex-column align-items-center justify-content-center" style="min-height: 70vh;">
      <div class="text-center mb-4">
        <i class="fas fa-file-invoice fa-5x text-secondary opacity-25 mb-3"></i>
        <h3 class="fw-bold text-secondary">Chưa có hóa đơn nào được tạo</h3>
        <p class="text-muted">Vui lòng tạo hóa đơn mới để bắt đầu bán hàng</p>
      </div>
      <button class="btn btn-danger btn-lg rounded-pill px-5 py-3 shadow-lg fw-bold" @click="addInvoice">
        <i class="fas fa-plus me-2"></i>TẠO HÓA ĐƠN MỚI
      </button>
    </div>

    <!-- Giao diện bán hàng khi đã có ít nhất 1 hóa đơn -->
    <template v-else>
      <!-- Hàng trên cùng: Quản lý hóa đơn chờ -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3 d-flex align-items-center flex-wrap gap-2">
              <div 
                v-for="(inv, index) in invoices" 
                :key="inv.code"
                class="invoice-tab d-flex align-items-center gap-2 px-3 py-2 rounded-3 border transition-all pointer"
                :class="activeInvoiceIndex === index ? 'bg-danger text-white border-danger shadow' : 'bg-light border-light'"
                @click="activeInvoiceIndex = index"
              >
                <span class="small fw-bold">Hóa đơn {{ index + 1 }}</span>
                <i class="fas fa-times small opacity-50 hover-opacity-100" @click.stop="removeInvoice(index)"></i>
              </div>
              <button class="btn btn-sm btn-light rounded-circle shadow-sm" @click="addInvoice">
                <i class="fas fa-plus"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm rounded-circle shadow-sm" @click="addInvoice" v-if="invoices.length < 5">
                <i class="fas fa-plus"></i>
              </button>
              <div class="ms-auto d-flex align-items-center text-muted">
                <i class="far fa-clock me-2"></i>
                <span class="small fw-bold">{{ formatDateTime(currentTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Cột bên trái: Tìm kiếm sản phẩm -->
        <div class="col-lg-7 col-xl-8">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-body p-4">
              <div class="input-group mb-4 rounded-pill overflow-hidden border bg-light shadow-sm">
                <span class="input-group-text bg-transparent border-0 ps-3"><i class="fas fa-barcode text-muted"></i></span>
                <input 
                  type="text" 
                  v-model="search" 
                  class="form-control bg-transparent border-0 shadow-none py-2" 
                  placeholder="Tìm kiếm sản phẩm (Tên, Mã, Barcode) hoặc quét mã..."
                  autofocus
                >
              </div>
              
              <!-- Danh sách kết quả tìm kiếm -->
              <div class="search-results">
                <div v-if="!filteredProducts || filteredProducts.length === 0" class="text-center py-5">
                  <i class="fas fa-search fa-3x text-light mb-3"></i>
                  <p class="text-muted">{{ search ? 'Không tìm thấy sản phẩm nào phù hợp' : 'Không có sản phẩm nào trong hệ thống' }}</p>
                </div>
                <div v-else class="table-responsive overflow-y-auto" style="max-height: 550px;">
                  <table class="table table-hover align-middle border-top">
                    <thead class="bg-light">
                      <tr class="small text-secondary">
                        <th class="border-0">SẢN PHẨM</th>
                        <th class="border-0">MÃ SP</th>
                        <th class="border-0">GIÁ BÁN</th>
                        <th class="border-0 text-center">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="product in filteredProducts" :key="product.id" class="pointer">
                        <td>
                          <div class="d-flex align-items-center">
                            <img :src="product.img" width="50" height="50" class="rounded object-fit-cover me-3 border">
                            <span class="fw-bold small text-dark">{{ product.name }}</span>
                          </div>
                        </td>
                        <td><span class="badge bg-light text-dark border small">SP00{{ product.id }}</span></td>
                        <td>
                          <div v-if="product.hasPromotion">
                            <span class="text-danger fw-bold d-block">{{ product.price.toLocaleString() }} đ</span>
                            <small class="text-muted text-decoration-line-through">{{ product.originalPrice.toLocaleString() }} đ</small>
                          </div>
                          <span v-else class="text-dark fw-bold">{{ product.price.toLocaleString() }} đ</span>
                        </td>
                        <td class="text-center">
                          <button class="btn btn-danger btn-sm rounded-pill px-3" @click.stop="openVariantModal(product)">
                            <i class="fas fa-plus me-1"></i> Thêm
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cột bên phải: Chi tiết hóa đơn & Thanh toán -->
        <div class="col-lg-5 col-xl-4" v-if="activeInvoice">
        <div class="card border-0 shadow-sm rounded-4 sticky-top" style="top: 20px;">
          <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold"><i class="fas fa-receipt me-2 text-danger"></i>HÓA ĐƠN</h5>
            <span class="badge bg-light text-dark border fw-normal">{{ activeInvoice.code }}</span>
          </div>

          <div class="card-body p-4">
            <!-- Thông tin khách hàng -->
            <div class="customer-section mb-4 p-3 bg-light rounded-3">
              <div v-if="!activeInvoice.customer">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="small fw-bold text-secondary">KHÁCH HÀNG</span>
                  <span class="badge bg-secondary-subtle text-secondary">Khách lẻ</span>
                </div>
                <div class="position-relative">
                  <div class="input-group input-group-sm rounded-pill border overflow-hidden bg-white shadow-sm">
                    <span class="input-group-text bg-white border-0"><i class="fas fa-user-plus text-muted"></i></span>
                    <input 
                      type="text" 
                      v-model="customerSearch" 
                      class="form-control border-0 shadow-none" 
                      placeholder="Tìm khách hàng (Tên, SĐT)..."
                    >
                    <button class="btn btn-danger btn-sm border-0" title="Thêm khách hàng mới" @click="showAddCustomerModal = true">
                      <i class="fas fa-plus"></i>
                    </button>
                  </div>
                  <!-- Dropdown kết quả tìm kiếm khách hàng -->
                  <div v-if="filteredCustomers.length > 0" class="position-absolute w-100 mt-1 shadow-lg rounded-3 border bg-white overflow-hidden" style="z-index: 1000;">
                    <div 
                      v-for="c in filteredCustomers" 
                      :key="c.id" 
                      class="p-2 border-bottom hover-bg-light pointer d-flex justify-content-between align-items-center"
                      @click="selectCustomer(c)"
                    >
                      <div>
                        <div class="fw-bold small">{{ c.name }}</div>
                        <div class="text-muted small" style="font-size: 11px;">{{ c.phone }}</div>
                      </div>
                      <span class="badge bg-danger-subtle text-danger" style="font-size: 10px;">{{ c.type }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <div class="avatar-sm me-3">{{ (activeInvoice.customer?.hoTen || activeInvoice.customer?.name || '?').charAt(0) }}</div>
                  <div>
                    <div class="fw-bold text-dark">{{ activeInvoice.customer?.hoTen || activeInvoice.customer?.name || 'Không rõ' }}</div>
                    <div class="text-muted small">{{ activeInvoice.customer?.soDienThoai || activeInvoice.customer?.phone || 'N/A' }}</div>
                  </div>
                </div>
                <button class="btn btn-sm btn-light rounded-circle" @click="activeInvoice.customer = null">
                  <i class="fas fa-times text-muted"></i>
                </button>
              </div>
            </div>

        
           <!-- Giỏ hàng (ĐÃ SỬA LỖI CÚ PHÁP) -->
            <div class="cart-section mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="small fw-bold text-secondary">DANH SÁCH SẢN PHẨM</span>
                <span class="badge bg-danger rounded-pill">{{ activeInvoice.cart?.length || 0 }}</span>
              </div>
              
              <div class="cart-items" style="max-height: 280px; overflow-y: auto;">
                
                <!-- Trường hợp trống -->
                <div v-if="!activeInvoice.cart || activeInvoice.cart.length === 0" class="text-center py-5 text-secondary opacity-50">
                  <i class="fas fa-shopping-basket fa-2x mb-2"></i>
                  <p class="small mb-0">Chưa có sản phẩm nào</p>
                </div>

                <!-- Danh sách sản phẩm -->
                <div v-for="(item, index) in activeInvoice.cart" :key="item.idGhct" class="d-flex align-items-center justify-content-between mb-3 p-2 rounded-3 bg-white border border-light shadow-sm">
                  
                  <!-- Thông tin SP -->
                  <div class="flex-grow-1 min-width-0 pe-2">
                    <p class="small mb-0 fw-bold text-truncate text-dark">
                      {{ item.sanPhamChiTiet?.sanPham?.tenSanPham || 'Tên sản phẩm' }}
                    </p>
                    <p class="small text-muted mb-0" style="font-size: 11px;">
                      {{ item.sanPhamChiTiet?.mauSac?.ten || 'Màu' }} / {{ item.sanPhamChiTiet?.kichThuoc?.ten || 'Size' }}
                    </p>
                    <p class="small text-danger mb-0 fw-bold">
                      <template v-if="item.donGia < item.sanPhamChiTiet?.giaBan">
                        <span class="text-muted text-decoration-line-through me-2" style="font-size: 10px;">{{ item.sanPhamChiTiet.giaBan.toLocaleString() }} đ</span>
                        <span>{{ item.donGia.toLocaleString() }} đ</span>
                        <span class="d-block text-success fw-normal mt-1" style="font-size: 9px;"><i class="fas fa-check-circle me-1"></i>Đã áp dụng giá tốt</span>
                      </template>
                      <template v-else>
                        {{ (item.donGia || item.sanPhamChiTiet?.giaBan || 0).toLocaleString() }} đ
                      </template>
                    </p>
                  </div>
                  
                  <!-- Nút Tăng Giảm Số Lượng -->
                  <div class="d-flex align-items-center">
                    <div class="input-group input-group-sm rounded border overflow-hidden shadow-none" style="width: 80px;">
                      
                      <!-- NÚT TRỪ (Đã thêm dấu cách trước @click) -->
                      <button 
                        class="btn btn-light px-2 border-0 shadow-none" 
                        @click="updateQuantity(item.idGhct, item.soLuong - 1)"
                      >
                        <i class="fas" :class="item.soLuong > 1 ? 'fa-minus' : 'fa-trash-alt text-danger'" style="font-size: 10px;"></i>
                      </button>
                      
                      <!-- Ô Nhập Số Lượng -->
                      <input 
                        type="number" 
                        class="form-control border-0 bg-white text-center p-0 fw-bold shadow-none" 
                        style="font-size: 13px;" 
                        :value="item.soLuong" 
                        @change="(e) => updateQuantity(item.idGhct, parseInt(e.target.value))"
                        min="1"
                      >
                      
                      <!-- NÚT CỘNG (Đã thêm dấu cách trước @click) -->
                      <button 
                        class="btn btn-light px-2 border-0 shadow-none" 
                        @click="updateQuantity(item.idGhct, item.soLuong + 1)"
                      >
                        <i class="fas fa-plus" style="font-size: 10px;"></i>
                      </button>

                    </div>
                  </div>
                </div>
                
              </div>
            </div>
            <!-- Voucher & Khuyến mại -->
            <div class="voucher-section mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="small fw-bold text-secondary">VOUCHER / KHUYẾN MẠI</span>
                <button class="btn btn-sm btn-outline-danger rounded-pill px-3" @click="openVoucherModal">
                  <i class="fas fa-ticket-alt me-1"></i> Chọn Voucher
                </button>
              </div>
              
              <div v-if="activeInvoice.voucher" class="p-3 border border-danger rounded-4 bg-danger-subtle d-flex justify-content-between align-items-center shadow-sm">
                <div>
                  <span class="small fw-bold text-danger d-block">{{ activeInvoice.voucher.maCode }}</span>
                  <small class="text-muted" style="font-size: 10px;">
                    Giảm: {{ activeInvoice.voucher.kieuGiamGia === 'PERCENT' ? activeInvoice.voucher.giaTriGiam + '%' : Number(activeInvoice.voucher.giaTriGiam).toLocaleString() + 'đ' }}
                    <template v-if="activeInvoice.voucher.giaTriGiamToiDa"> (Tối đa: {{ Number(activeInvoice.voucher.giaTriGiamToiDa).toLocaleString() }}đ)</template>
                  </small>
                </div>
                <button class="btn btn-sm btn-danger rounded-circle shadow-sm" @click="selectVoucher(null)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div v-else class="text-center py-3 border rounded-4 bg-light text-muted small dashed-border">
                <i class="fas fa-ticket-alt me-2 opacity-50"></i>Bấm "Chọn Voucher" để áp dụng mã giảm giá
              </div>
            </div>

            <!-- Tổng kết thanh toán -->
            <div class="summary-section border-top pt-4">
              <div class="d-flex justify-content-between mb-2">
                <span class="text-secondary small">Tạm tính:</span>
                <span class="fw-bold">{{ activeInvoice.subTotal.toLocaleString() }} đ</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-secondary small">Giảm giá:</span>
                <span class="text-success fw-bold">-{{ activeInvoice.discount.toLocaleString() }} đ</span>
              </div>
              <div class="d-flex justify-content-between mb-4">
                <span class="h5 fw-bold mb-0">Tổng tiền:</span>
                <span class="h5 fw-bold text-danger mb-0">{{ activeInvoice.total.toLocaleString() }} đ</span>
              </div>

              <!-- Hình thức thanh toán -->
              <div class="payment-methods mb-4">
                <span class="small fw-bold text-secondary d-block mb-3">HÌNH THỨC THANH TOÁN</span>
                <div class="row g-2">
                  <div class="col-6">
                    <div 
                      class="p-2 border rounded-3 text-center pointer transition-all"
                      :class="selectedPaymentMethod === 'CASH' ? 'border-danger bg-danger-subtle text-danger shadow-sm' : 'bg-light'"
                      @click="selectedPaymentMethod = 'CASH'"
                    >
                      <i class="fas fa-money-bill-wave d-block mb-1"></i>
                      <span class="small fw-bold">Tiền mặt</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div 
                      class="p-2 border rounded-3 text-center pointer transition-all"
                      :class="selectedPaymentMethod === 'TRANSFER' ? 'border-danger bg-danger-subtle text-danger shadow-sm' : 'bg-light'"
                      @click="selectedPaymentMethod = 'TRANSFER'"
                    >
                      <i class="fas fa-university d-block mb-1"></i>
                      <span class="small fw-bold">Chuyển khoản</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- QR Code VietQR (Chỉ hiện khi chọn Chuyển khoản) -->
              <div v-if="selectedPaymentMethod === 'TRANSFER'" class="qr-code-section text-center mb-4 p-3 border rounded-4 bg-white shadow-sm">
                <p class="small text-muted mb-2">Quét mã để thanh toán</p>
                <img :src="vietQrUrl" class="img-fluid rounded-3" alt="VietQR" style="max-width: 180px;">
                <div class="mt-2 small fw-bold text-dark">{{ bankInfo.bankId }} - {{ bankInfo.accountNo }}</div>
              </div>

              <button class="btn btn-danger w-100 py-3 fw-bold rounded-4 shadow btn-checkout" @click="openPaymentModal" :disabled="!activeInvoice.cart || activeInvoice.cart.length === 0">
                XÁC NHẬN THANH TOÁN
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Modal chọn biến thể sản phẩm -->
      <div v-if="variantModalVisible" class="payment-modal-overlay">
        <div class="payment-modal-content rounded-4 shadow-lg overflow-hidden border-0">
          <div class="modal-header bg-danger text-white p-4 border-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold"><i class="fas fa-box-open me-2"></i>Chọn biến thể</h5>
            <button class="btn-close btn-close-white shadow-none" @click="variantModalVisible = false"></button>
          </div>
          <div class="modal-body p-4 bg-light">
            <p class="small text-muted mb-3">Sản phẩm: <strong>{{ selectedProduct?.name || '' }}</strong></p>
            <div v-if="variantOptions.length === 0" class="text-center text-muted">Không có biến thể</div>
            <div v-else>
              <div class="mb-3">
                <label class="form-label small">Biến thể</label>
                <select class="form-select" v-model="selectedVariant" style="font-size: 14px;">
                  <option v-for="variant in variantOptions" :key="variant.id" :value="variant">
                    {{ variant.mauSac?.ten || 'Màu?' }} / {{ variant.kichThuoc?.ten || 'Size?' }} / Giá: {{ Number(variant.giaBan || 0).toLocaleString() }} đ / Tồn: {{ variant.soLuong || 0 }}
                  </option>
                </select>
              </div>
              <div class="mb-4">
                <label class="form-label small">Số lượng</label>
                <input type="number" class="form-control" v-model.number="variantQuantity" min="1" />
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-light" @click="variantModalVisible = false">Hủy</button>
              <button class="btn btn-danger" @click="addToCartSelectedVariant">Thêm vào hóa đơn</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Xác nhận thanh toán -->
      <div v-if="showPaymentModal" class="payment-modal-overlay">
        <div class="payment-modal-content rounded-4 shadow-lg overflow-hidden border-0">
          <div class="modal-header bg-danger text-white p-4 border-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold"><i class="fas fa-check-circle me-2"></i>XÁC NHẬN THANH TOÁN</h5>
            <button class="btn-close btn-close-white shadow-none" @click="showPaymentModal = false"></button>
          </div>
          
          <div class="modal-body p-4 bg-light overflow-auto" style="max-height: 60vh;">
            <div class="row g-4">
              <!-- Cột trái: Tóm tắt đơn -->
              <div class="col-md-6 border-end">
                <div class="mb-4">
                  <span class="small fw-bold text-secondary d-block mb-2">MÃ HÓA ĐƠN</span>
                  <div class="h5 fw-bold text-dark">{{ activeInvoice.code }}</div>
                </div>
                
                <div class="p-3 bg-white rounded-3 shadow-sm mb-4">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted small">Tạm tính:</span>
                    <span class="fw-bold">{{ activeInvoice.subTotal.toLocaleString() }} đ</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted small">Giảm giá:</span>
                    <span class="text-success fw-bold">-{{ activeInvoice.discount.toLocaleString() }} đ</span>
                  </div>
                  <hr>
                  <div class="d-flex justify-content-between">
                    <span class="h5 fw-bold mb-0">CẦN THANH TOÁN:</span>
                    <span class="h5 fw-bold text-danger mb-0">{{ activeInvoice.total.toLocaleString() }} đ</span>
                  </div>
                </div>

                <div class="mb-3">
                  <span class="small fw-bold text-secondary d-block mb-2">PHƯƠNG THỨC</span>
                  <div class="d-flex gap-2">
                    <span class="badge py-2 px-3 rounded-pill bg-danger shadow-sm">
                      <i class="fas" :class="selectedPaymentMethod === 'CASH' ? 'fa-money-bill-wave' : 'fa-university'"></i>
                      {{ selectedPaymentMethod === 'CASH' ? ' Tiền mặt' : ' Chuyển khoản' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Cột phải: Xử lý tiền mặt / Chuyển khoản -->
              <div class="col-md-6">
                <div v-if="selectedPaymentMethod === 'CASH'">
                  <div class="mb-4">
                    <label class="small fw-bold text-secondary d-block mb-2">SỐ TIỀN KHÁCH ĐƯA</label>
                    <div class="input-group input-group-lg border rounded-3 overflow-hidden shadow-sm bg-white">
                      <input 
                        type="number" 
                        v-model.number="customerCash" 
                        class="form-control border-0 text-end fw-bold shadow-none"
                        @focus="$event.target.select()"
                      >
                      <span class="input-group-text bg-white border-0 fw-bold">đ</span>
                    </div>
                  </div>

                  <div class="p-4 bg-white rounded-4 text-center mb-4 border shadow-sm">
                    <span class="small fw-bold text-muted d-block mb-1">TIỀN THỪA TRẢ KHÁCH</span>
                    <div class="h3 fw-bold text-danger mb-0">{{ changeAmount.toLocaleString() }} đ</div>
                  </div>

                  <!-- Quick amounts -->
                  <div class="d-flex flex-wrap gap-2">
                    <button 
                      v-for="amount in suggestedCashAmounts" 
                      :key="amount"
                      class="btn btn-sm btn-outline-danger rounded-pill px-3 transition-all"
                      @click="customerCash = amount"
                    >
                      {{ amount.toLocaleString() }} đ
                    </button>
                  </div>
                </div>

                <div v-else class="text-center">
                  <p class="small text-muted mb-3">Mời khách quét mã QR để chuyển khoản</p>
                  <div class="p-4 bg-white rounded-4 shadow border mb-4 d-inline-block w-100">
                    <img :src="vietQrUrl" class="img-fluid rounded-3" style="max-height: 400px; width: 100%; object-fit: contain;">
                  </div>
                  <div class="p-3 bg-white border rounded-3 text-start d-flex justify-content-between align-items-center">
                    <div>
                      <div class="small text-muted mb-1">{{ bankInfo.bankId }}</div>
                      <div class="fw-bold text-dark fs-5">{{ bankInfo.accountNo }}</div>
                      <div class="small text-muted text-uppercase">{{ bankInfo.accountName }}</div>
                    </div>
                    <button class="btn btn-light btn-sm rounded-circle shadow-sm" @click="navigator.clipboard.writeText(bankInfo.accountNo)">
                      <i class="far fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer p-4 border-0 bg-white d-flex justify-content-end gap-3">
            <button class="btn btn-light btn-lg rounded-pill px-4 fw-bold" @click="showPaymentModal = false">QUAY LẠI</button>
            <button 
              class="btn btn-danger btn-lg rounded-pill px-5 fw-bold shadow transition-all" 
              @click="confirmPayment"
              :disabled="selectedPaymentMethod === 'CASH' && customerCash < activeInvoice.total"
            >
              HOÀN TẤT THANH TOÁN
            </button>
          </div>
        </div>
      </div>
      <!-- Modal Chọn Voucher -->
      <div v-if="voucherModalVisible" class="payment-modal-overlay">
        <div class="payment-modal-content rounded-4 shadow-lg overflow-hidden border-0" style="max-width: 600px;">
          <div class="modal-header bg-danger text-white p-4 border-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold"><i class="fas fa-ticket-alt me-2"></i>CHỌN VOUCHER</h5>
            <button class="btn-close btn-close-white shadow-none" @click="voucherModalVisible = false"></button>
          </div>
          <div class="modal-body p-4 bg-light overflow-auto" style="max-height: 500px;">
            <div class="mb-4">
              <div class="input-group input-group-lg border rounded-3 overflow-hidden shadow-sm bg-white">
                <input 
                  type="text" 
                  class="form-control border-0 shadow-none ps-4" 
                  placeholder="Nhập mã voucher thủ công..." 
                  v-model="manualVoucherCode"
                  @keyup.enter="() => { selectVoucher(manualVoucherCode); voucherModalVisible = false; }"
                >
                <button class="btn btn-danger px-4 fw-bold" type="button" @click="() => { selectVoucher(manualVoucherCode); voucherModalVisible = false; }">ÁP DỤNG</button>
              </div>
            </div>

            <div v-if="vouchers.length === 0" class="text-center py-5">
              <i class="fas fa-ticket-alt fa-3x text-light mb-3"></i>
              <p class="text-muted">Không tìm thấy voucher nào trong hệ thống</p>
            </div>
            <div v-else class="row g-3">
              <div v-for="v in vouchers" :key="v.id" class="col-12">
                <div 
                  class="voucher-card p-3 rounded-4 border bg-white shadow-sm transition-all pointer"
                  :class="{ 
                    'border-danger': activeInvoice.voucher?.id === v.id,
                    'opacity-50 grayscale': !applicableVouchers.find(av => av.id === v.id)
                  }"
                  @click="handleVoucherClick(v)"
                >
                  <div class="d-flex align-items-center">
                    <div class="voucher-icon-box bg-danger-subtle text-danger rounded-3 me-3 d-flex align-items-center justify-content-center">
                      <i class="fas fa-ticket-alt fs-4"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between align-items-start mb-1">
                        <span class="fw-bold text-dark fs-5">{{ v.maCode }}</span>
                        <span class="badge bg-danger-subtle text-danger fs-6">-{{ v.kieuGiamGia === 'PERCENT' ? v.giaTriGiam + '%' : Number(v.giaTriGiam).toLocaleString() + 'đ' }}</span>
                      </div>
                      
                      <!-- Điều kiện giá trị đơn hàng -->
                      <div class="text-muted small">
                        <i class="fas fa-info-circle me-1"></i>Đơn tối thiểu: <strong>{{ Number(v.giaTriToiThieu || 0).toLocaleString() }}đ</strong>
                      </div>
                      <div v-if="v.giaTriGiamToiDa" class="text-muted small">
                        <i class="fas fa-arrow-down me-1"></i>Giảm tối đa: <strong>{{ Number(v.giaTriGiamToiDa).toLocaleString() }}đ</strong>
                      </div>

                      <!-- Thông tin số lượng và thời gian -->
                      <div class="d-flex flex-wrap gap-3 mt-1">
                        <div class="text-muted small">
                          <i class="fas fa-box me-1"></i>Còn lại: <strong>{{ (v.soLuong || 0) - (v.soLuongDaDung || 0) }}</strong>
                        </div>
                        <div class="text-muted small">
                          <i class="fas fa-calendar-alt me-1"></i>Hạn dùng: <strong>{{ v.ngayKetHuc ? new Date(v.ngayKetHuc).toLocaleDateString('vi-VN') : 'Vô thời hạn' }}</strong>
                        </div>
                      </div>

                      <!-- Cảnh báo chưa đủ điều kiện -->
                      <div v-if="!applicableVouchers.find(av => av.id === v.id)" class="mt-2">
                        <div v-if="activeInvoice.subTotal < v.giaTriToiThieu" class="text-danger small fw-bold">
                          <i class="fas fa-exclamation-triangle me-1"></i>Mua thêm <strong>{{ Number(v.giaTriToiThieu - activeInvoice.subTotal).toLocaleString() }}đ</strong> để áp dụng
                        </div>
                        <div v-else class="text-danger small fw-bold">
                          <i class="fas fa-exclamation-triangle me-1"></i>Chưa đủ điều kiện áp dụng
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Thêm nhanh khách hàng -->
      <div v-if="showAddCustomerModal" class="payment-modal-overlay">
        <div class="payment-modal-content rounded-4 shadow-lg overflow-hidden border-0" style="max-width: 450px;">
          <div class="modal-header bg-danger text-white p-3 border-0 d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold"><i class="fas fa-user-plus me-2"></i>THÊM NHANH KHÁCH HÀNG</h6>
            <button class="btn-close btn-close-white shadow-none" @click="showAddCustomerModal = false"></button>
          </div>
          <div class="modal-body p-4 bg-light">
            <div class="mb-3">
              <label class="form-label small fw-bold text-secondary">HỌ VÀ TÊN</label>
              <input 
                type="text" 
                class="form-control form-control-lg border-0 shadow-sm rounded-3" 
                placeholder="Nhập tên khách hàng..."
                v-model="newCustomer.hoTen"
              >
            </div>
            <div class="mb-4">
              <label class="form-label small fw-bold text-secondary">SỐ ĐIỆN THOẠI</label>
              <input 
                type="text" 
                class="form-control form-control-lg border-0 shadow-sm rounded-3" 
                placeholder="Nhập số điện thoại..."
                v-model="newCustomer.soDienThoai"
              >
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-light btn-lg flex-grow-1 rounded-3 fw-bold" @click="showAddCustomerModal = false">HỦY</button>
              <button class="btn btn-danger btn-lg flex-grow-1 rounded-3 fw-bold" @click="handleQuickAddCustomer">XÁC NHẬN</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashed-border {
  border: 2px dashed #dee2e6 !important;
}

.voucher-card {
  border-left: 5px solid #dee2e6 !important;
}

.voucher-card.border-danger {
  border-left: 5px solid #dc3545 !important;
}

.voucher-card:hover:not(.grayscale) {
  transform: scale(1.02);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1) !important;
}

.grayscale {
  filter: grayscale(1);
}

.voucher-icon-box {
  width: 60px;
  height: 60px;
}

.payment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.payment-modal-content {
  width: 90%;
  max-width: 850px;
  max-height: 90vh;
  background: white;
  animation: modal-up 0.3s ease-out;
}

@keyframes modal-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.btn-white {
  background: white;
  border: none;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-white:hover {
  background-color: #f8f9fa;
  transform: scale(1.05);
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "/";
}

.pos-view {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.invoice-tab {
  cursor: pointer;
  min-width: 120px;
  transition: all 0.2s ease;
}

.invoice-tab:hover {
  background-color: #f1f3f5;
}

.invoice-tab.bg-danger:hover {
  background-color: #dc3545;
}

.product-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
}

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(220, 53, 69, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: 0.3s;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.avatar-sm {
  width: 36px;
  height: 36px;
  background: #343a40;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
}

.hover-bg-light:hover {
  background-color: #f8f9fa;
}

.pointer {
  cursor: pointer;
}

.btn-checkout {
  transition: all 0.3s;
  letter-spacing: 1px;
}

.btn-checkout:not(:disabled):hover {
  transform: scale(1.02);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
}

.cart-items::-webkit-scrollbar {
  width: 4px;
}

.cart-items::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 10px;
}

.transition-all {
  transition: all 0.2s;
}

.hover-opacity-100:hover {
  opacity: 1 !important;
}
</style>





