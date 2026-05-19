import axios from 'axios';
import { API_BASE_URL } from '@/config';

const ADMIN = `${API_BASE_URL}/api/admin/doi-tra`;
const PUBLIC = `${API_BASE_URL}/api/doi-tra`;

export const returnApi = {
  list: () => axios.get(ADMIN),
  detail: (id) => axios.get(`${ADMIN}/${id}`),
  logs: (id) => axios.get(`${ADMIN}/logs/doi-tra/${id}`),

  approve: (id) => axios.put(`${ADMIN}/${id}/xac-nhan`),
  reject: (id, ghiChu) => axios.put(`${ADMIN}/${id}/tu-choi`, { ghiChu }),
  received: (id) => axios.put(`${ADMIN}/${id}/da-nhan-hang`),

  kiem: (id, body) => axios.put(`${ADMIN}/${id}/kiem`, body),
  duyetKiem: (id, body) => axios.put(`${ADMIN}/${id}/duyet-kiem`, body),
  duyetTraLai: (id, body) => axios.put(`${ADMIN}/${id}/duyet-tra-lai`, body),

  setBenChiuLoi: (id, benChiuLoi) => axios.put(`${ADMIN}/${id}/ben-chiu-loi`, { benChiuLoi }),
  quyetDinh: (id, ghiChuAdmin) => axios.put(`${ADMIN}/${id}/quyet-dinh`, { ghiChuAdmin }),
  hoanTien: (id, body) => axios.put(`${ADMIN}/${id}/hoan-tien`, body),
  khachXacNhanThuCong: (id, ghiChu) => axios.put(`${ADMIN}/${id}/khach-xac-nhan-thu-cong`, { ghiChu }),
  cancel: (id, ghiChu) => axios.put(`${ADMIN}/${id}/huy`, { ghiChu }),

  upload: (files, doiTraId, baseUrl) => {
    const form = new FormData();
    (files || []).forEach((f) => form.append('files', f));
    form.append('doiTraId', doiTraId);
    form.append('baseUrl', baseUrl);
    return axios.post(`${ADMIN}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getConfirmInfo: (token) => axios.get(`${PUBLIC}/confirm-info`, { params: { token } }),
  confirmReceived: (token) => axios.post(`${PUBLIC}/xac-nhan-nhan-tien`, { token })
};

export default returnApi;
