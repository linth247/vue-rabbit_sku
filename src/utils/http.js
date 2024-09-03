// axios 基礎的封裝
import axios from 'axios'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/el-message.css'
// import { useUserStore } from '@/stores/userStore'
import router from '@/router'

const httpInstance = axios.create({
 baseURL:'https://pcapi-xiaotuxian-front-devtest.itheima.net',
 timeout: 5000
})

// 攔截器
// axios请求攔截器
httpInstance.interceptors.request.use(config => {
	//1.從pinia獲取token數據
	// const userStore = useUserStore()
	// //2.按照後端的要求拼接token數據
	// const token = userStore.userInfo.token
	// // console.log(token)
	// if(token){
	// 	config.headers.Authorization = `Bearer ${token}`
	// }
	return config
}, e => Promise.reject(e))
  
// axios響應式攔截器
httpInstance.interceptors.response.use(res => res.data, e => {
	// const userStore = useUserStore()
	// 統一錯誤提示
	ElMessage({
			type:'warning',
			message: e.response.data.message
	})
	// 401token失效處理
	// 1.清除本地用戶數據
	// 2.跳轉到登入頁
	// if(e.response.status === 401){
	// 	userStore.clearUserInfo()
	// 	router.push('/login')
	// }
	return Promise.reject(e)
})

export default httpInstance