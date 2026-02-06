import { AlertPriority } from '../types/alerts'

interface NotificationOptions {
  title: string
  body: string
  priority: AlertPriority
  icon?: string
  sound?: boolean
}

interface SystemNotificationResult {
  success: boolean
  error?: string
  method: 'tauri' | 'browser' | 'none'
}

/**
 * 发送系统通知
 * 
 * 支持环境：
 * 1. Tauri 桌面应用 (tauri-plugin-notification)
 * 2. Web 浏览器 (Notification API)
 * 3. 回退到控制台日志
 */
export async function sendSystemNotification(options: NotificationOptions): Promise<SystemNotificationResult> {
  const { title, body, priority, icon, sound = false } = options
  
  // 检查是否在 Tauri 环境
  if ('__TAURI_INTERNALS__' in window || window.__TAURI__) {
    return await sendTauriNotification(title, body, priority, sound)
  }
  
  // 检查是否支持浏览器通知
  if ('Notification' in window) {
    return await sendBrowserNotification(title, body, icon)
  }
  
  // 回退到控制台日志
  console.log(`[Notification] ${title}: ${body} (Priority: ${priority})`)
  return {
    success: true,
    method: 'none',
  }
}

/**
 * 发送 Tauri 系统通知
 */
async function sendTauriNotification(
  title: string, 
  body: string, 
  priority: AlertPriority,
  sound: boolean
): Promise<SystemNotificationResult> {
  try {
    // 动态导入 Tauri 通知插件
    const { isPermissionGranted, requestPermission, sendNotification } = 
      await import('@tauri-apps/plugin-notification')
    
    // 检查权限
    let permissionGranted = await isPermissionGranted()
    if (!permissionGranted) {
      const permission = await requestPermission()
      permissionGranted = permission === 'granted'
    }
    
    if (permissionGranted) {
      await sendNotification({
        title,
        body,
        // 高优先级警报添加声音
        sound: sound && (priority === 'high' || priority === 'critical') ? 'default' : undefined,
        // 可选：添加图标和通知分组
        icon: 'icon.png',
        tag: `alert-${priority}`,
      })
      
      return {
        success: true,
        method: 'tauri',
      }
    } else {
      throw new Error('Notification permission not granted')
    }
  } catch (error: any) {
    console.error('Tauri notification failed:', error)
    // 回退到浏览器通知
    return await sendBrowserNotification(title, body)
  }
}

/**
 * 发送浏览器通知
 */
async function sendBrowserNotification(
  title: string, 
  body: string, 
  icon?: string
): Promise<SystemNotificationResult> {
  try {
    if (!('Notification' in window)) {
      throw new Error('Browser notifications not supported')
    }
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, { 
        body, 
        icon: icon || '/favicon.ico',
        tag: 'my-doge-alert',
        requireInteraction: false,
      })
      
      // 设置自动关闭
      setTimeout(() => {
        notification.close()
      }, 5000)
      
      return {
        success: true,
        method: 'browser',
      }
    } 
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const notification = new Notification(title, { 
          body, 
          icon: icon || '/favicon.ico',
        })
        
        setTimeout(() => {
          notification.close()
        }, 5000)
        
        return {
          success: true,
          method: 'browser',
        }
      }
    }
    
    throw new Error('Notification permission denied or not granted')
  } catch (error: any) {
    console.error('Browser notification failed:', error)
    return {
      success: false,
      error: error.message,
      method: 'browser',
    }
  }
}

/**
 * 检查通知权限状态
 */
export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  // 检查是否在 Tauri 环境
  if ('__TAURI_INTERNALS__' in window || window.__TAURI__) {
    try {
      const { isPermissionGranted } = await import('@tauri-apps/plugin-notification')
      const granted = await isPermissionGranted()
      return granted ? 'granted' : 'denied'
    } catch {
      return 'default'
    }
  }
  
  // 浏览器环境
  if ('Notification' in window) {
    return Notification.permission
  }
  
  return 'denied'
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // 检查是否在 Tauri 环境
  if ('__TAURI_INTERNALS__' in window || window.__TAURI__) {
    try {
      const { requestPermission } = await import('@tauri-apps/plugin-notification')
      const permission = await requestPermission()
      return permission === 'granted'
    } catch {
      return false
    }
  }
  
  // 浏览器环境
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  
  return false
}

/**
 * 发送测试通知
 */
export async function sendTestNotification(): Promise<SystemNotificationResult> {
  return await sendSystemNotification({
    title: '测试通知',
    body: '这是一条测试通知，用于验证通知系统是否正常工作。',
    priority: 'medium',
    sound: true,
  })
}

/**
 * 通知工具类
 */
export const NotificationUtils = {
  sendSystemNotification,
  checkNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
}

// 默认导出
export default NotificationUtils