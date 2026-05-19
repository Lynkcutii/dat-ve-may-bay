import axios from 'axios';
import { API_BASE_URL } from '@/config';

const BASE = `${API_BASE_URL}/api/admin/cau-hinh-doi-tra`;

export const returnConfigApi = {
  get: () => axios.get(BASE),
  update: (body) => axios.put(BASE, body)
};

export default returnConfigApi;
