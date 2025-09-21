/**
 * 工具函数模块
 * 包含通用的辅助函数和工具方法
 */

class Utils {
    /**
     * 获取优先级颜色（Bootstrap类名）
     */
    static getPriorityColor(priority) {
        switch(priority) {
            case 'high': return 'danger';     // 红色 - 高优先级
            case 'medium': return 'warning';  // 橙色 - 中优先级
            case 'low': return 'info';        // 蓝色 - 低优先级
            default: return 'warning';        // 默认中优先级
        }
    }

    /**
     * 获取优先级颜色的十六进制值（用于日历和进度条）
     */
    static getPriorityColorHex(priority) {
        switch(priority) {
            case 'high': return '#dc3545';    // Bootstrap danger 红色
            case 'medium': return '#fd7e14';  // Bootstrap warning 橙色
            case 'low': return '#0dcaf0';     // Bootstrap info 蓝色
            default: return '#fd7e14';        // 默认中优先级橙色
        }
    }

    /**
     * 获取优先级文本
     */
    static getPriorityText(priority) {
        switch(priority) {
            case 'high': return '高';
            case 'medium': return '中';
            case 'low': return '低';
            default: return '中';
        }
    }

    /**
     * 获取优先级徽章HTML
     */
    static getPriorityBadge(priority) {
        const colorClass = this.getPriorityColor(priority);
        const text = this.getPriorityText(priority);
        return `<span class="badge bg-${colorClass}">${text}</span>`;
    }

    /**
     * 获取状态文本
     */
    static getStatusText(status) {
        switch(status) {
            case 'pending': return '未开始';
            case 'in_progress': return '进行中';
            case 'completed': return '已完成';
            default: return '未知';
        }
    }

    /**
     * 获取工作流步骤状态文本
     */
    static getStepStatusText(status) {
        switch(status) {
            case 'pending': return '待处理';
            case 'active': return '进行中';
            case 'in_progress': return '进行中';
            case 'completed': return '已完成';
            default: return '未知';
        }
    }

    /**
     * 获取状态徽章类名
     */
    static getStatusBadgeClass(status) {
        switch(status) {
            case 'pending': return 'bg-secondary';
            case 'in_progress': return 'bg-primary';
            case 'completed': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    /**
 * 获取状态徽章HTML
 */
static getStatusBadge(status, isOverdue = false) {
    const badgeClass = this.getStatusBadgeClass(status);
    const statusText = this.getStatusText(status);
    let badge = `<span class="badge ${badgeClass}">${statusText}</span>`;
    
    // 如果任务已延期，添加延期标识
    if (isOverdue) {
        badge += ` <span class="badge bg-danger">已延期</span>`;
    }
    
    return badge;
}

    /**
     * 获取任务类型徽章HTML
     */
    static getTypeBadge(taskType) {
        const typeColors = {
            '五年战略规划': 'primary',
            '商业计划': 'success',
            '管理报告': 'info',
            '临时报告': 'warning',
            '创新管理': 'danger'
        };
        const colorClass = typeColors[taskType] || 'secondary';
        return `<span class="badge bg-${colorClass}">${taskType}</span>`;
    }

    /**
     * 格式化日期时间字符串
     * 将UTC时间转换为东八区时间
     * 更新于: ${new Date().toISOString()}
     */
    static formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        
        try {
            // 确保日期字符串格式正确
            let dateStr = dateTimeString;
            if (typeof dateTimeString === 'string' && !dateTimeString.includes('Z') && !dateTimeString.includes('+')) {
                // 如果没有时区信息，假设是UTC时间，添加Z表示
                dateStr = dateTimeString + 'Z';
            }
            
            // 创建日期对象
            const date = new Date(dateStr);
            
            // 直接使用toLocaleString方法，指定东八区时区
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Shanghai'
            };
            
            // 格式化为YYYY-MM-DD HH:MM格式
            const formatted = date.toLocaleString('zh-CN', options)
                .replace(/\//g, '-')  // 替换可能的斜杠为连字符
                .replace(',', '');    // 移除可能的逗号
                
            return formatted;
        } catch (error) {
            console.error('日期格式化失败:', error);
            
            // 备用方案：手动转换为东八区时间
            try {
                const date = new Date(dateTimeString);
                // 转换为东八区时间（UTC+8）
                const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
                const beijingTime = new Date(utc + (3600000 * 8));
                
                const year = beijingTime.getFullYear();
                const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
                const day = String(beijingTime.getDate()).padStart(2, '0');
                const hours = String(beijingTime.getHours()).padStart(2, '0');
                const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
                
                return `${year}-${month}-${day} ${hours}:${minutes}`;
            } catch (e) {
                console.error('备用日期格式化也失败:', e);
                return dateTimeString;
            }
        }
    }

    /**
     * 转义HTML字符
     */
    static escapeHtml(text) {
        if (!text) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * 获取进度条类名
     */
    static getProgressBarClass(percentage) {
        if (percentage >= 80) return 'bg-success';
        if (percentage >= 50) return 'bg-info';
        if (percentage >= 30) return 'bg-warning';
        return 'bg-danger';
    }

    /**
     * 计算任务进度百分比
     */
    static getTaskProgressPercentage(task) {
        if (task.status === 'completed') {
            return 100;
        }
        if (task.status === 'pending') {
            return 0;
        }
        if (task.status === 'in_progress' && task.progress && task.task_type) {
            // 根据工作流程步骤计算进度
            const workflows = {
                '五年战略规划': ['来文需求研究', '历史数据调研', '拟定框架', '提交至各部门收集数据', '梳理与补充内容材料', '各部门审阅', '领导审阅', '提交上级单位'],
                '商业计划': ['市场分析', '竞争对手分析', '商业模式设计', '财务预测', '营销策略', '运营计划', '团队建设', '风险管理'],
                '管理报告': ['数据收集和整理', '关键指标分析', '问题识别和分析', '解决方案制定', '报告撰写', '图表制作', '内部审核', '最终提交'],
                '临时报告': ['需求确认', '资料收集', '分析和总结', '报告撰写', '审核和修改', '提交'],
                '创新管理': ['创新需求识别', '创新方案征集', '方案评估', '项目立项', '资源配置', '项目实施', '效果评估', '推广应用']
            };
            
            const steps = workflows[task.task_type];
            if (steps) {
                const currentStepIndex = steps.indexOf(task.progress);
                if (currentStepIndex >= 0) {
                    return Math.round(((currentStepIndex + 1) / steps.length) * 100);
                }
            }
            return 50; // 默认进行中为50%
        }
        return 25; // 其他情况默认25%
    }

    /**
     * 获取工作流进度选项
     */
    static getProgressOptions(taskType) {
        const workflows = {
            '五年战略规划': ['来文需求研究', '历史数据调研', '拟定框架', '提交至各部门收集数据', '梳理与补充内容材料', '各部门审阅', '领导审阅', '提交上级单位'],
            '商业计划': ['市场分析', '竞争对手分析', '商业模式设计', '财务预测', '营销策略', '运营计划', '团队建设', '风险管理'],
            '管理报告': ['数据收集和整理', '关键指标分析', '问题识别和分析', '解决方案制定', '报告撰写', '图表制作', '内部审核', '最终提交'],
            '临时报告': ['需求确认', '资料收集', '分析和总结', '报告撰写', '审核和修改', '提交'],
            '创新管理': ['创新需求识别', '创新方案征集', '方案评估', '项目立项', '资源配置', '项目实施', '效果评估', '推广应用']
        };
        
        return workflows[taskType] || [];
    }

    /**
     * 显示成功消息
     */
    static showSuccess(message) {
        // 可以集成Toast或其他通知组件
        console.log('成功:', message);
    }

    /**
     * 显示信息消息
     */
    static showInfo(message) {
        // 可以集成Toast或其他通知组件
        console.log('信息:', message);
        alert(message);
    }

    /**
     * 显示错误消息
     */
    static showError(message) {
        // 可以集成Toast或其他通知组件
        console.error('错误:', message);
        alert(message);
    }

    /**
     * 显示加载状态
     */
    static showLoading(element) {
        if (element) {
            element.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> 加载中...';
        }
    }

    /**
     * 隐藏加载状态
     */
    static hideLoading(element, originalContent = '') {
        if (element) {
            element.innerHTML = originalContent;
        }
    }
}

// 导出工具类
window.Utils = Utils;