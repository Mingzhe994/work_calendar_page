from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, abort
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from services.auth_service import AuthService
from models import User, db
from functools import wraps

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('您没有权限访问此页面', 'danger')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """用户登录"""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        success, result = AuthService.authenticate_user(username, password)
        if success:
            login_user(result)
            next_page = request.args.get('next')
            # 如果是管理员用户，直接跳转到管理后台主界面
            if result.is_admin:
                return redirect(url_for('auth.admin_dashboard'))
            # 非管理员用户按原逻辑跳转
            if next_page is None or not next_page.startswith('/'):
                next_page = url_for('main.index')
            return redirect(next_page)
        else:
            flash(result, 'danger')
    
    return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """用户注册"""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('两次输入的密码不一致', 'danger')
            return render_template('auth/register.html')
        
        success, message = AuthService.register_user(username, email, password)
        if success:
            flash(message, 'success')
            return redirect(url_for('auth.login'))
        else:
            flash(message, 'danger')
    
    return render_template('auth/register.html')

@auth_bp.route('/logout')
@login_required
def logout():
    """用户登出"""
    logout_user()
    flash('您已成功登出', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/admin/dashboard')
@login_required
@admin_required
def admin_dashboard():
    """管理员控制台"""
    # 获取搜索关键词
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    per_page = 10  # 每页显示的用户数量
    
    # 根据搜索关键词过滤用户
    if search:
        users_query = User.query.filter(
            (User.username.contains(search)) | 
            (User.email.contains(search))
        )
    else:
        users_query = User.query
    
    # 分页
    pagination = users_query.paginate(page=page, per_page=per_page, error_out=False)
    users = pagination.items
    
    return render_template('auth/admin_dashboard.html', 
                          users=users, 
                          pagination=pagination,
                          search=search)

# 旧版admin_users路由已被移除，使用admin_dashboard替代

@auth_bp.route('/admin/users/create', methods=['GET', 'POST'])
@login_required
def create_user():
    """管理员创建用户"""
    if not current_user.is_admin:
        flash('您没有权限访问此页面', 'danger')
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        is_admin = 'is_admin' in request.form
        
        if User.query.filter_by(username=username).first():
            flash('用户名已存在', 'danger')
            return render_template('auth/create_user.html')
        
        if User.query.filter_by(email=email).first():
            flash('邮箱已被注册', 'danger')
            return render_template('auth/create_user.html')
        
        user = User(username=username, email=email, is_admin=is_admin)
        user.password = password
        db.session.add(user)
        db.session.commit()
        
        flash('用户创建成功', 'success')
        return redirect(url_for('auth.admin_dashboard'))
    
    return render_template('auth/create_user.html')

@auth_bp.route('/admin/reset_password/<int:user_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def reset_password_page(user_id):
    """管理员重置用户密码页面"""
    user = User.query.get_or_404(user_id)
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('两次输入的密码不匹配', 'danger')
            return redirect(url_for('auth.reset_password_page', user_id=user_id))
        
        user.set_password(password)
        db.session.commit()
        flash(f'用户 {user.username} 的密码已重置', 'success')
        return redirect(url_for('auth.admin_dashboard'))
    
    return render_template('auth/reset_password.html', user=user)

@auth_bp.route('/admin/reset_user_password', methods=['POST'])
@login_required
@admin_required
def reset_user_password():
    # 优先从URL参数获取user_id，如果没有则从表单获取
    user_id = request.args.get('user_id') or request.form.get('user_id')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    
    if not user_id or not new_password or not confirm_password:
        flash('所有字段都是必填的', 'danger')
        return redirect(url_for('auth.admin_dashboard'))
    
    if new_password != confirm_password:
        flash('两次输入的密码不匹配', 'danger')
        return redirect(url_for('auth.admin_dashboard'))
    
    user = User.query.get_or_404(user_id)
    user.password = new_password
    db.session.commit()
    
    flash(f'用户 {user.username} 的密码已重置', 'success')
    return redirect(url_for('auth.admin_dashboard'))

@auth_bp.route('/admin/users/delete/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def delete_user(user_id):
    """管理员删除用户"""
    user = User.query.get_or_404(user_id)
    
    # 不允许删除自己
    if user.id == current_user.id:
        flash('不能删除当前登录的管理员账号', 'danger')
        return redirect(url_for('auth.admin_dashboard'))
    
    db.session.delete(user)
    db.session.commit()
    
    flash(f'用户 {user.username} 已被删除', 'success')
    return redirect(url_for('auth.admin_dashboard'))