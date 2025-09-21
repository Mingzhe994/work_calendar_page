from flask import Blueprint, jsonify
from services import AnalyticsService

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api')

@analytics_bp.route('/analytics')
def get_analytics():
    """获取分析统计数据"""
    try:
        data = AnalyticsService.get_analytics_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/statistics')
def get_statistics():
    """获取任务统计信息"""
    try:
        data = AnalyticsService.get_task_statistics()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500