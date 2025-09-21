/**
 * 日历模块
 * 负责FullCalendar的初始化和管理
 */

class CalendarModule {
    constructor() {
        this.calendar = null;
    }

    /**
     * 初始化日历
     */
    static async init() {
        const instance = new CalendarModule();
        await instance.initializeCalendar();
        window.CalendarModule = instance;
        return instance;
    }

    /**
     * 初始化FullCalendar
     */
    async initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            console.error('找不到日历容器元素');
            return;
        }

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'zh-cn',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            events: '/api/tasks?exclude_completed=true',
            eventDisplay: 'block',
            eventColor: (info) => {
                const priority = info.event.extendedProps.priority || 'medium';
                return Utils.getPriorityColorHex(priority);
            },
            eventClassNames: (info) => {
                const priority = info.event.extendedProps.priority || 'medium';
                return `task-priority-${priority}`;
            },
            eventClick: (info) => {
                this.handleEventClick(info.event);
            },
            dateClick: (info) => {
                this.handleDateClick(info);
            },
            eventDidMount: (info) => {
                // 为事件添加工具提示
                this.addEventTooltip(info);
            }
        });

        this.calendar.render();
        console.log('日历初始化完成');
    }

    /**
     * 处理事件点击
     */
    handleEventClick(event) {
        if (window.TaskModule) {
            // 使用任务ID从服务器获取完整任务信息，而不是直接使用event.extendedProps
            window.TaskModule.showTaskDetailsFromList(event.id);
        }
    }

    /**
     * 处理日期点击
     */
    handleDateClick(info) {
        // 点击日期时预填截止日期
        const deadlineInput = document.getElementById('taskDeadline');
        if (deadlineInput) {
            deadlineInput.value = info.dateStr;
        }
        
        // 显示添加任务模态框
        const addTaskModal = document.getElementById('addTaskModal');
        if (addTaskModal) {
            new bootstrap.Modal(addTaskModal).show();
        }
    }

    /**
     * 为事件添加工具提示
     */
    addEventTooltip(info) {
        const event = info.event;
        const props = event.extendedProps;
        
        // 如果任务已延期，添加视觉标识
        if (props.is_overdue) {
            info.el.classList.add('task-overdue');
        }
        
        const tooltipContent = `
            <div class="tooltip-content">
                <strong>${event.title}</strong><br>
                类型: ${props.task_type || '未知'}<br>
                状态: ${Utils.getStatusText(props.status)}<br>
                ${props.description ? `描述: ${props.description}<br>` : ''}
                ${props.start_date ? `开始: ${props.start_date}<br>` : ''}
                ${props.deadline ? `截止: ${props.deadline}` : ''}
            </div>
        `;
        
        // 使用Bootstrap的tooltip或自定义tooltip
        info.el.setAttribute('title', tooltipContent);
        info.el.setAttribute('data-bs-toggle', 'tooltip');
        info.el.setAttribute('data-bs-html', 'true');
    }

    /**
     * 刷新日历事件
     */
    async refreshEvents() {
        if (this.calendar) {
            try {
                const response = await fetch('/api/tasks?exclude_completed=true');
                const tasks = await response.json();
                
                const events = tasks.map(task => {
                    const event = {
                        id: task.id,
                        title: `${task.title} [${task.progress || task.status}]`,
                        start: task.start_date,
                        allDay: true,
                        extendedProps: {
                            task_type: task.task_type,
                            description: task.description,
                            status: task.status,
                            progress: task.progress,
                            start_date: task.start_date,
                            deadline: task.deadline,
                            priority: task.priority
                        }
                    };
                    
                    // 如果有截止日期，设置结束日期为截止日期的下一天
                    if (task.deadline) {
                        const endDate = new Date(task.deadline);
                        endDate.setDate(endDate.getDate() + 1);
                        event.end = endDate.toISOString().split('T')[0];
                    }
                    
                    return event;
                });
                
                this.calendar.removeAllEvents();
                this.calendar.addEventSource(events);
                
                console.log('日历事件已刷新');
            } catch (error) {
                console.error('刷新日历事件失败:', error);
            }
        }
    }

    /**
     * 添加单个事件
     */
    addEvent(task) {
        if (this.calendar) {
            const event = {
                id: task.id,
                title: `${task.title} [${task.progress || task.status}]`,
                start: task.start_date,
                allDay: true,
                extendedProps: {
                    task_type: task.task_type,
                    description: task.description,
                    status: task.status,
                    progress: task.progress,
                    start_date: task.start_date,
                    deadline: task.deadline,
                    priority: task.priority
                }
            };
            
            if (task.deadline) {
                const endDate = new Date(task.deadline);
                endDate.setDate(endDate.getDate() + 1);
                event.end = endDate.toISOString().split('T')[0];
            }
            
            this.calendar.addEvent(event);
        }
    }

    /**
     * 移除事件
     */
    removeEvent(taskId) {
        if (this.calendar) {
            const event = this.calendar.getEventById(taskId);
            if (event) {
                event.remove();
            }
        }
    }

    /**
     * 更新事件
     */
    updateEvent(task) {
        if (this.calendar) {
            const event = this.calendar.getEventById(task.id);
            if (event) {
                event.setProp('title', `${task.title} [${task.progress || task.status}]`);
                event.setStart(task.start_date);
                
                if (task.deadline) {
                    const endDate = new Date(task.deadline);
                    endDate.setDate(endDate.getDate() + 1);
                    event.setEnd(endDate.toISOString().split('T')[0]);
                } else {
                    event.setEnd(null);
                }
                
                event.setExtendedProp('task_type', task.task_type);
                event.setExtendedProp('description', task.description);
                event.setExtendedProp('status', task.status);
                event.setExtendedProp('progress', task.progress);
                event.setExtendedProp('priority', task.priority);
            }
        }
    }

    /**
     * 获取日历实例
     */
    getCalendar() {
        return this.calendar;
    }

    /**
     * 切换视图
     */
    changeView(viewName) {
        if (this.calendar) {
            this.calendar.changeView(viewName);
        }
    }

    /**
     * 跳转到今天
     */
    goToToday() {
        if (this.calendar) {
            this.calendar.today();
        }
    }

    /**
     * 跳转到指定日期
     */
    goToDate(date) {
        if (this.calendar) {
            this.calendar.gotoDate(date);
        }
    }
}

// 导出日历模块
// CalendarModule实例通过CalendarModule.init()方法设置到window.CalendarModule
// 不需要在这里设置类本身