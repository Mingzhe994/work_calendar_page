/**
 * 模态弹窗工具类
 * 用于统一任务列表、问题列表和工作流列表三个模态弹窗的交互效果
 */
class ModalUtils {
    /**
     * 初始化模态弹窗统一效果
     */
    static initModalEffects() {
        // 为所有模态弹窗添加统一的显示动画
        document.querySelectorAll('.modal').forEach(modal => {
            // 添加显示事件监听
            modal.addEventListener('show.bs.modal', function() {
                // 添加淡入效果类
                this.classList.add('fade-in');
                
                // 初始化模态弹窗中的按钮效果
                ModalUtils.initButtonEffects(this);
            });
            
            // 添加隐藏事件监听
            modal.addEventListener('hide.bs.modal', function() {
                // 移除淡入效果类
                this.classList.remove('fade-in');
            });
        });
    }
    
    /**
     * 初始化模态弹窗中的按钮效果
     * @param {HTMLElement} modal 模态弹窗元素
     */
    static initButtonEffects(modal) {
        // 为模态弹窗中的所有按钮添加统一的点击效果
        modal.querySelectorAll('.btn').forEach(btn => {
            // 移除之前可能添加的事件监听
            btn.removeEventListener('mousedown', ModalUtils.buttonPressEffect);
            btn.removeEventListener('mouseup', ModalUtils.buttonReleaseEffect);
            btn.removeEventListener('mouseleave', ModalUtils.buttonReleaseEffect);
            
            // 添加按下效果
            btn.addEventListener('mousedown', ModalUtils.buttonPressEffect);
            
            // 添加释放效果
            btn.addEventListener('mouseup', ModalUtils.buttonReleaseEffect);
            btn.addEventListener('mouseleave', ModalUtils.buttonReleaseEffect);
        });
    }
    
    /**
     * 按钮按下效果
     * @param {Event} e 事件对象
     */
    static buttonPressEffect(e) {
        e.currentTarget.style.transform = 'scale(0.95)';
    }
    
    /**
     * 按钮释放效果
     * @param {Event} e 事件对象
     */
    static buttonReleaseEffect(e) {
        e.currentTarget.style.transform = '';
    }
    
    /**
     * 显示模态弹窗
     * @param {string} modalId 模态弹窗ID
     * @param {Function} callback 显示后的回调函数
     */
    static showModal(modalId, callback = null) {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) return;
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        if (callback && typeof callback === 'function') {
            modalElement.addEventListener('shown.bs.modal', callback, { once: true });
        }
    }
    
    /**
     * 隐藏模态弹窗
     * @param {string} modalId 模态弹窗ID
     * @param {Function} callback 隐藏后的回调函数
     */
    static hideModal(modalId, callback = null) {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) return;
        
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (!modal) return;
        
        modal.hide();
        
        if (callback && typeof callback === 'function') {
            modalElement.addEventListener('hidden.bs.modal', callback, { once: true });
        }
    }
}

// 在文档加载完成后初始化模态弹窗效果
document.addEventListener('DOMContentLoaded', function() {
    ModalUtils.initModalEffects();
});

// 导出模态弹窗工具类
window.ModalUtils = ModalUtils;