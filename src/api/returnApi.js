import axios from 'axios';
import { API_BASE_URL } from '@/config';

const ADMIN = `${API_BASE_URL}/api/admin/doi-tra`;
const USER = `${API_BASE_URL}/api/user/doi-tra`;

export const returnApi = {
  list: () => axios.get(ADMIN),
  detail: (id) => axios.get(`${ADMIN}/${id}`),
  logs: (id) => axios.get(`${ADMIN}/logs/doi-tra/${id}`),

  approve: (id) => axios.put(`${ADMIN}/${id}/xac-nhan`),
  reject: (id, ghiChu = '') => axios.put(`${ADMIN}/${id}/tu-choi`, { ghiChu }),
  received: (id) => axios.put(`${ADMIN}/${id}/da-nhan-hang`),

  kiem: (id, body) => axios.put(`${ADMIN}/${id}/kiem`, body),
  quyetDinh: (id, action, ghiChuAdmin = '') => axios.put(`${ADMIN}/${id}/quyet-dinh`, { action, ghiChuAdmin }),
  hoanTien: (id, body) => axios.put(`${ADMIN}/${id}/hoan-tien`, body),
  xuLyKhangNghi: (id, body) => axios.put(`${ADMIN}/${id}/xu-ly-khang-nghi`, body),
  cancel: (id, ghiChu) => axios.put(`${ADMIN}/${id}/huy`, { ghiChu }),

  uploadKiem: (doiTraId, files) => {
    const form = new FormData();
    form.append('doiTraId', doiTraId);
    (files || []).forEach((f) => form.append('files', f));
    return axios.post(`${ADMIN}/upload-kiem`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  uploadChungTu: (doiTraId, files) => {
    const form = new FormData();
    form.append('doiTraId', doiTraId);
    (files || []).forEach((f) => form.append('files', f));
    return axios.post(`${ADMIN}/upload-chung-tu`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  userDetail: (userId, doiTraId) => axios.get(`${USER}/${userId}/${doiTraId}`),
  userByHoaDon: (userId, hoaDonId) => axios.get(`${USER}/${userId}/hoa-don/${hoaDonId}`),
  khangNghi: (userId, doiTraId, body) => axios.put(`${USER}/${userId}/${doiTraId}/khang-nghi`, body),

  getConfirmInfo: (token) => axios.get(`${USER}/confirm-info`, { params: { token } }),
  confirmReceived: (token) => axios.post(`${USER}/xac-nhan-nhan-tien`, { token })
};

export default returnApi;
