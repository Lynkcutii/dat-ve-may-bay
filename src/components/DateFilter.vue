<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ day: '', month: '', year: '' })
  }
});

const emit = defineEmits(['update:modelValue', 'filter']);

const day = ref(props.modelValue.day || '');
const month = ref(props.modelValue.month || '');
const year = ref(props.modelValue.year || '');

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

watch([day, month, year], () => {
  emit('update:modelValue', { day: day.value, month: month.value, year: year.value });
});

const handleFilter = () => {
  emit('filter', { day: day.value, month: month.value, year: year.value });
};

const handleReset = () => {
  day.value = '';
  month.value = '';
  year.value = '';
  emit('filter', { day: '', month: '', year: '' });
};
</script>

<template>
  <div class="date-filter d-flex flex-wrap gap-2 align-items-end bg-white p-3 rounded-3 shadow-sm mb-4">
    <div class="filter-item">
      <label class="form-label small fw-bold text-secondary mb-1">Ngày</label>
      <select v-model="day" class="form-select form-select-sm border-0 bg-light">
        <option value="">Tất cả</option>
        <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
      </select>
    </div>
    <div class="filter-item">
      <label class="form-label small fw-bold text-secondary mb-1">Tháng</label>
      <select v-model="month" class="form-select form-select-sm border-0 bg-light">
        <option value="">Tất cả</option>
        <option v-for="m in months" :key="m" :value="m">Tháng {{ m }}</option>
      </select>
    </div>
    <div class="filter-item">
      <label class="form-label small fw-bold text-secondary mb-1">Năm</label>
      <select v-model="year" class="form-select form-select-sm border-0 bg-light">
        <option value="">Tất cả</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
    <div class="filter-actions d-flex gap-2">
      <button @click="handleFilter" class="btn btn-sm btn-danger rounded-pill px-3">
        <i class="fas fa-filter me-1"></i>Lọc
      </button>
      <button @click="handleReset" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
        <i class="fas fa-undo me-1"></i>Reset
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-filter {
  max-width: fit-content;
}
.filter-item {
  min-width: 100px;
}
.form-select:focus {
  box-shadow: none;
  background-color: #f8f9fa;
}
</style>
