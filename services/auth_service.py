from models import db, User

class AuthService:
    @staticmethod
    def register_user(username, email, password):
        """注册新用户"""
        # 检查用户名和邮箱是否已存在
        if User.query.filter_by(username=username).first():
            return False, "用户名已存在"
        
        if User.query.filter_by(email=email).first():
            return False, "邮箱已存在"
        
        # 创建新用户
        user = User(username=username, email=email)
        user.password = password
        
        try:
            db.session.add(user)
            db.session.commit()
            return True, "注册成功"
        except Exception as e:
            db.session.rollback()
            return False, f"注册失败: {str(e)}"
    
    @staticmethod
    def authenticate_user(username, password):
        """验证用户登录"""
        user = User.query.filter_by(username=username).first()
        
        if user and user.verify_password(password):
            return True, user
        
        return False, "用户名或密码错误"
    
    @staticmethod
    def get_user_by_id(user_id):
        """根据ID获取用户"""
        return User.query.get(user_id)
    
    @staticmethod
    def create_admin_if_not_exists():
        """确保管理员账号存在"""
        return User.create_admin()