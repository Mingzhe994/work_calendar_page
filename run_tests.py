#!/usr/bin/env python
import os
import sys
import pytest
import datetime

def run_tests():
    """运行所有测试并生成报告"""
    print("开始执行工作日历系统测试...")
    
    # 创建测试报告目录
    if not os.path.exists('test_reports'):
        os.makedirs('test_reports')
    
    # 生成报告文件名
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = f'test_reports/test_report_{timestamp}.txt'
    
    # 运行测试并捕获输出
    test_args = [
        '-v',  # 详细输出
        'tests/test_models.py',  # 模型测试
        'tests/test_services.py',  # 服务层测试
        'tests/test_routes.py',  # API路由测试
        # 'tests/test_frontend.py',  # 前端测试（需要安装selenium）
    ]
    
    # 执行测试
    with open(report_file, 'w') as f:
        f.write("工作日历系统测试报告\n")
        f.write("=" * 50 + "\n")
        f.write(f"测试时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 50 + "\n\n")
        
        # 运行测试
        result = pytest.main(test_args)
        
        # 写入测试结果
        if result == 0:
            f.write("\n测试结果: 全部通过\n")
        else:
            f.write(f"\n测试结果: 失败 (代码: {result})\n")
    
    print(f"测试完成，报告已保存到 {report_file}")
    return result

if __name__ == "__main__":
    sys.exit(run_tests())