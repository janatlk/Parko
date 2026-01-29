"""
Утилиты для экспорта отчетов в различные форматы (CSV, XLSX).
"""
import csv
import io
from typing import Any, Dict, List

from django.http import HttpResponse


def export_to_csv(data: List[Dict[str, Any]], filename: str) -> HttpResponse:
    """
    Экспорт данных в CSV формат.
    
    Args:
        data: Список словарей с данными для экспорта
        filename: Имя файла для скачивания
    
    Returns:
        HttpResponse с CSV файлом
    """
    if not data:
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    output = io.StringIO()
    
    # Получаем заголовки из первой строки
    fieldnames = list(data[0].keys())
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(data)
    
    response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response


def export_to_xlsx(data: List[Dict[str, Any]], filename: str, sheet_name: str = 'Report') -> HttpResponse:
    """
    Экспорт данных в XLSX формат.
    
    Args:
        data: Список словарей с данными для экспорта
        filename: Имя файла для скачивания
        sheet_name: Название листа в Excel
    
    Returns:
        HttpResponse с XLSX файлом
    """
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, Alignment
    except ImportError:
        raise ImportError("openpyxl не установлен. Установите: pip install openpyxl")
    
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name
    
    if not data:
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    # Заголовки
    fieldnames = list(data[0].keys())
    
    # Стилизация заголовков
    for col_num, fieldname in enumerate(fieldnames, 1):
        cell = ws.cell(row=1, column=col_num, value=fieldname)
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center')
    
    # Данные
    for row_num, row_data in enumerate(data, 2):
        for col_num, fieldname in enumerate(fieldnames, 1):
            ws.cell(row=row_num, column=col_num, value=row_data.get(fieldname))
    
    # Автоматическая ширина колонок
    for column_cells in ws.columns:
        length = max(len(str(cell.value or '')) for cell in column_cells)
        ws.column_dimensions[column_cells[0].column_letter].width = min(length + 2, 50)
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response


def prepare_maintenance_costs_for_export(report_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Подготовка данных отчета по затратам на ТО для экспорта.
    
    Args:
        report_data: Данные отчета из get_maintenance_costs_report
    
    Returns:
        Список словарей для экспорта
    """
    rows = []
    
    # Добавляем строки по машинам
    for car_data in report_data.get('by_car', []):
        rows.append({
            'Машина (номер)': car_data.get('car__numplate', ''),
            'Стоимость запчастей (сом)': car_data.get('part_total', 0),
            'Стоимость работ (сом)': car_data.get('job_total', 0),
            'Итого (сом)': car_data.get('total', 0),
        })
    
    # Добавляем итоговую строку
    totals = report_data.get('totals', {})
    rows.append({
        'Машина (номер)': 'ИТОГО',
        'Стоимость запчастей (сом)': totals.get('part_total', 0),
        'Стоимость работ (сом)': totals.get('job_total', 0),
        'Итого (сом)': totals.get('total', 0),
    })
    
    return rows


def prepare_fuel_consumption_for_export(report_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Подготовка данных отчета по топливу для экспорта.
    """
    rows = []
    
    for car_data in report_data.get('by_car', []):
        rows.append({
            'Машина (номер)': car_data.get('car__numplate', ''),
            'Марка': car_data.get('car__brand', ''),
            'Литры': car_data.get('total_liters', 0),
            'Стоимость (сом)': car_data.get('total_cost', 0),
            'Пробег (км)': car_data.get('total_mileage', 0),
            'Средний расход (л/100км)': car_data.get('avg_consumption', 0),
        })
    
    totals = report_data.get('totals', {})
    rows.append({
        'Машина (номер)': 'ИТОГО',
        'Марка': '',
        'Литры': totals.get('total_liters', 0),
        'Стоимость (сом)': totals.get('total_cost', 0),
        'Пробег (км)': totals.get('total_mileage', 0),
        'Средний расход (л/100км)': totals.get('avg_consumption', 0),
    })
    
    return rows


def prepare_insurance_inspection_for_export(report_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Подготовка данных отчета по страховкам/техосмотрам для экспорта.
    """
    rows = []
    
    status_map = {
        'active': 'Активна',
        'expiring_soon': 'Скоро истекает',
        'expired': 'Просрочена',
    }
    
    type_map = {
        'insurance': 'Страховка',
        'inspection': 'Техосмотр',
    }
    
    for item in report_data.get('items', []):
        rows.append({
            'Тип': type_map.get(item.get('type', ''), item.get('type', '')),
            'Машина (номер)': item.get('car__numplate', ''),
            'Номер': item.get('number', ''),
            'Дата начала': item.get('start_date', ''),
            'Дата окончания': item.get('end_date', ''),
            'Стоимость (сом)': item.get('cost', 0),
            'Статус': status_map.get(item.get('status', ''), item.get('status', '')),
        })
    
    return rows
