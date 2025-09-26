import re
from typing import List, Dict, Optional, Any
from models import db, Workflow, Task
from config import Config

class WorkflowService:
    """工作流服务类"""
    
    @staticmethod
    def copy_default_workflows_for_user(user_id: int) -> None:
        """将全局默认工作流复制给指定用户"""
        try:
            default_workflows = Workflow.query.filter_by(user_id=None).all()
            for default_workflow in default_workflows:
                # 移除可能存在的旧用户ID后缀
                cleaned_workflow_name = re.sub(r' \(用户ID: \d+\)', '', default_workflow.name)
                # 为复制的工作流名称添加用户ID后缀，确保唯一性
                new_workflow_name = f"{cleaned_workflow_name} (用户ID: {user_id})"

                # 检查该用户是否已存在同名工作流
                existing_user_workflow = Workflow.query.filter_by(
                    name=new_workflow_name,
                    user_id=user_id
                ).first()

                if existing_user_workflow:
                    print(f"用户 {user_id} 已存在工作流 '{new_workflow_name}'，跳过复制。")
                    continue

                new_workflow = Workflow(
                    name=new_workflow_name,
                    description=default_workflow.description,
                    is_default=False,
                    user_id=user_id
                )
                new_workflow.set_steps(default_workflow.get_steps())
                db.session.add(new_workflow)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_workflow_by_task_type(task_type: str, user_id=None) -> Dict[str, Any]:
        """根据任务类型获取工作流"""
        # 首先尝试从数据库获取工作流
        query = Workflow.query.filter_by(name=task_type)
        
        # 如果指定了用户ID，按用户过滤
        if user_id:
            query = query.filter_by(user_id=user_id)
            
        workflow = query.first()
        if workflow:
            return {'steps': workflow.get_steps()}
        
        # 如果数据库中没有，则使用硬编码的工作流（向后兼容）
        if task_type in Config.DEFAULT_WORKFLOWS:
            return {'steps': Config.DEFAULT_WORKFLOWS[task_type]}
        
        return {'error': 'Task type not found'}
    
    @staticmethod
    def get_all_workflows(user_id=None) -> List[Dict[str, Any]]:
        """获取所有工作流，如果提供user_id则只返回该用户的工作流"""
        query = Workflow.query
        
        # 如果指定了用户ID，按用户过滤
        if user_id:
            query = query.filter_by(user_id=user_id)
            
        workflows = query.all()
        return [workflow.to_dict() for workflow in workflows]
    
    @staticmethod
    def create_workflow(data: Dict[str, Any]) -> Dict[str, Any]:
        """创建新工作流"""
        if not data or 'name' not in data:
            return {'success': False, 'error': 'Name is required'}
        
        # 检查工作流名称是否已存在
        existing_workflow = Workflow.query.filter_by(name=data['name']).first()
        if existing_workflow:
            return {'success': False, 'error': 'Workflow name already exists'}
        
        try:
            # 获取steps，如果没有提供则使用空列表
            steps = data.get('steps', [])
            
            # 如果提供了steps，验证是否为有效的列表
            if steps and not isinstance(steps, list):
                return {'success': False, 'error': 'Steps must be a list'}
            
            workflow = Workflow(
                name=data['name'],
                description=data.get('description', ''),
                is_default=data.get('is_default', False),
                user_id=data.get('user_id')
            )
            workflow.set_steps(steps)
            
            db.session.add(workflow)
            db.session.commit()
            
            return {
                'success': True,
                'workflow': workflow.to_dict()
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def update_workflow(workflow_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """更新工作流"""
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return {'success': False, 'error': '工作流不存在'}
        
        if not data:
            return {'success': False, 'error': 'No data provided'}
        
        try:
            if 'name' in data:
                # 检查新名称是否与其他工作流冲突
                existing_workflow = Workflow.query.filter_by(
                    name=data['name']
                ).filter(Workflow.id != workflow_id).first()
                if existing_workflow:
                    return {'success': False, 'error': 'Workflow name already exists'}
                workflow.name = data['name']
            
            if 'description' in data:
                workflow.description = data['description']
            
            if 'steps' in data:
                if not isinstance(data['steps'], list):
                    return {'success': False, 'error': 'Steps must be a list'}
                
                # 检查是否有正在执行的任务使用此工作流，如果有则禁止修改步骤
                active_tasks = Task.query.filter(
                    Task.task_type == workflow.name,
                    Task.status.in_(['pending', 'in_progress'])
                ).count()
                
                if active_tasks > 0:
                    return {
                        'success': False,
                        'error': f'无法修改工作流步骤，当前有 {active_tasks} 个正在执行的任务使用此工作流类型'
                    }
                
                workflow.set_steps(data['steps'])
            
            if 'is_default' in data:
                # 如果设置为默认，先将所有其他工作流设为非默认
                if data['is_default']:
                    Workflow.query.filter(Workflow.id != workflow_id).update({'is_default': False})
                workflow.is_default = data['is_default']
            
            db.session.commit()
            
            return {
                'success': True,
                'workflow': workflow.to_dict()
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
            
    @staticmethod
    def set_default_workflow(workflow_id: int) -> Dict[str, Any]:
        """设置默认工作流"""
        try:
            workflow = Workflow.query.get(workflow_id)
            if not workflow:
                return {'success': False, 'error': '工作流不存在'}
            
            # 将所有工作流设为非默认
            Workflow.query.update({'is_default': False})
            
            # 将当前工作流设为默认
            workflow.is_default = True
            db.session.commit()
            
            return {
                'success': True,
                'message': f'已将 "{workflow.name}" 设为默认工作流',
                'workflow': workflow.to_dict()
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def delete_workflow(workflow_id: int) -> Dict[str, Any]:
        """删除工作流"""
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return {'success': False, 'error': '工作流不存在'}
        
        # 检查是否有正在执行的任务使用此工作流
        active_tasks = Task.query.filter(
            Task.task_type == workflow.name,
            Task.status.in_(['pending', 'in_progress'])
        ).count()
        
        if active_tasks > 0:
            return {
                'success': False,
                'error': f'无法删除工作流，当前有 {active_tasks} 个正在执行的任务使用此工作流类型'
            }
        
        try:
            db.session.delete(workflow)
            db.session.commit()
            return {'success': True}
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_workflow_steps(workflow_id: int) -> Dict[str, Any]:
        """获取工作流步骤"""
        try:
            workflow = Workflow.query.get(workflow_id)
            if not workflow:
                return {'error': 'Workflow not found'}
            
            steps_data = workflow.get_steps()
            
            # 将简单字符串数组转换为前端期望的对象格式
            formatted_steps = []
            for index, step_title in enumerate(steps_data):
                formatted_steps.append({
                    'id': index + 1,
                    'title': step_title,
                    'description': '',
                    'status': 'pending',
                    'estimated_hours': 0,
                    'actual_hours': 0,
                    'assignee': '',
                    'due_date': None,
                    'dependencies': [],
                    'notes': ''
                })
            
            return formatted_steps
        except Exception as e:
            return {'error': f'Failed to get workflow steps: {str(e)}'}
    
    @staticmethod
    def get_workflow_steps_by_name(workflow_name: str) -> Dict[str, Any]:
        """通过工作流名称获取工作流步骤"""
        try:
            workflow = Workflow.query.filter_by(name=workflow_name).first()
            if not workflow:
                return {'error': 'Workflow not found'}
            
            steps_data = workflow.get_steps()
            
            # 将简单字符串数组转换为前端期望的对象格式
            formatted_steps = []
            for index, step_title in enumerate(steps_data):
                formatted_steps.append({
                    'id': index + 1,
                    'title': step_title,
                    'description': '',
                    'status': 'pending',
                    'estimated_hours': 0,
                    'actual_hours': 0,
                    'assignee': '',
                    'due_date': None,
                    'dependencies': [],
                    'notes': ''
                })
            
            return formatted_steps
        except Exception as e:
            return {'error': f'Failed to get workflow steps: {str(e)}'}
    
    @staticmethod
    def add_workflow_step(workflow_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """添加工作流步骤"""
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return {'success': False, 'error': '工作流不存在'}
        
        if not data or 'title' not in data:
            return {'success': False, 'error': '步骤标题是必需的'}
        
        # 检查是否有正在执行的任务使用此工作流
        active_tasks = Task.query.filter(
            Task.task_type == workflow.name,
            Task.status.in_(['pending', 'in_progress'])
        ).count()
        
        if active_tasks > 0:
            return {
                'success': False,
                'error': f'无法修改工作流步骤，当前有 {active_tasks} 个正在执行的任务使用此工作流类型'
            }
        
        try:
            steps = workflow.get_steps()
            steps.append(data['title'])
            workflow.set_steps(steps)
            
            db.session.commit()
            
            return {
                'success': True,
                'message': '步骤添加成功',
                'steps': workflow.get_steps()
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def update_workflow_step(workflow_id: int, step_index: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """更新工作流步骤"""
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return {'success': False, 'error': '工作流不存在'}
        
        if not data or 'title' not in data:
            return {'success': False, 'error': '步骤标题是必需的'}
        
        # 检查是否有正在执行的任务使用此工作流
        active_tasks = Task.query.filter(
            Task.task_type == workflow.name,
            Task.status.in_(['pending', 'in_progress'])
        ).count()
        
        if active_tasks > 0:
            return {
                'success': False,
                'error': f'无法修改工作流步骤，当前有 {active_tasks} 个正在执行的任务使用此工作流类型'
            }
        
        try:
            steps = workflow.get_steps()
            if step_index < 0 or step_index >= len(steps):
                return {'success': False, 'error': '步骤索引无效'}
            
            steps[step_index] = data['title']
            workflow.set_steps(steps)
            
            db.session.commit()
            
            return {
                'success': True,
                'message': '步骤更新成功',
                'steps': workflow.get_steps()
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def delete_workflow_step(workflow_id: int, step_index: int) -> Dict[str, Any]:
        """删除工作流步骤"""
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return {'success': False, 'error': '工作流不存在'}
        
        # 检查是否有正在执行的任务使用此工作流
        active_tasks = Task.query.filter(
            Task.task_type == workflow.name,
            Task.status.in_(['pending', 'in_progress'])
        ).count()
        
        if active_tasks > 0:
            return {
                'success': False,
                'error': f'无法修改工作流步骤，当前有 {active_tasks} 个正在执行的任务使用此工作流类型'
            }
        
        try:
            steps = workflow.get_steps()
            if step_index < 0 or step_index >= len(steps):
                return {'success': False, 'error': '步骤索引无效'}
            
            steps.pop(step_index)
            workflow.set_steps(steps)
            
            db.session.commit()
            
            return {
                'success': True,
                'message': '步骤删除成功',
                'steps': workflow.get_steps()
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def reorder_workflow_steps(workflow_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """调整工作流步骤顺序"""
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return {'success': False, 'error': '工作流不存在'}
        
        if not data or 'steps' not in data:
            return {'success': False, 'error': '步骤列表是必需的'}
        
        # 检查是否有正在执行的任务使用此工作流
        active_tasks = Task.query.filter(
            Task.task_type == workflow.name,
            Task.status.in_(['pending', 'in_progress'])
        ).count()
        
        if active_tasks > 0:
            return {
                'success': False,
                'error': f'无法修改工作流步骤，当前有 {active_tasks} 个正在执行的任务使用此工作流类型'
            }
        
        try:
            new_steps = data['steps']
            if not isinstance(new_steps, list):
                return {'success': False, 'error': '步骤必须是列表格式'}
            
            workflow.set_steps(new_steps)
            
            db.session.commit()
            
            return {
                'success': True,
                'message': '步骤顺序调整成功',
                'steps': workflow.get_steps()
            }
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def initialize_default_workflows() -> None:
        """初始化默认工作流"""
        try:
            # 检查是否已经初始化过
            existing_count = Workflow.query.count()
            if existing_count > 0:
                return  # 已经有工作流，不需要重复初始化
            
            # 创建默认工作流
            for workflow_name, steps in Config.DEFAULT_WORKFLOWS.items():
                existing_workflow = Workflow.query.filter_by(name=workflow_name).first()
                if not existing_workflow:
                    workflow = Workflow(
                        name=workflow_name,
                        description=f'默认{workflow_name}工作流',
                        is_default=True
                    )
                    workflow.set_steps(steps)
                    db.session.add(workflow)
            
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f'初始化默认工作流失败: {str(e)}')