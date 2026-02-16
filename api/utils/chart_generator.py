"""
Static Chart Generator for MSA Analysis.

Generates SVG images of MSA charts using pygal for lightweight server-side rendering.
Returns base64-encoded SVG images that can be embedded directly in HTML.
"""
import base64
from typing import Any
from collections import defaultdict

import pygal
from pygal.style import Style


# =============================================================================
# Chart Configuration
# =============================================================================

# Color palette matching the frontend theme
COLORS = {
    'primary': '#3B82F6',      # Blue
    'secondary': '#F97316',    # Orange
    'success': '#10B981',      # Green
    'warning': '#F59E0B',      # Amber
    'danger': '#EF4444',       # Red
    'muted': '#6B7280',        # Gray
    'background': '#FFFFFF',   # White
    'text': '#1F2937',         # Dark gray
    'grid': '#E5E7EB',         # Light gray
}

# High contrast colors for interaction plot
CONTRAST_COLORS = [
    '#E63946',  # Red
    '#1D3557',  # Dark Blue
    '#2A9D8F',  # Teal
    '#F4A261',  # Orange
    '#9B5DE5',  # Purple
    '#00B4D8',  # Cyan
]

# Custom style
custom_style = Style(
    background='white',
    plot_background='white',
    foreground=COLORS['text'],
    foreground_strong=COLORS['text'],
    foreground_subtle=COLORS['muted'],
    colors=(COLORS['primary'], COLORS['secondary'], COLORS['success'],
            COLORS['warning'], COLORS['danger']),
    font_family='sans-serif',
)


# =============================================================================
# Helper Functions
# =============================================================================

def svg_to_base64(svg_string: str) -> str:
    """Convert SVG string to base64-encoded data URL."""
    b64 = base64.b64encode(svg_string.encode('utf-8')).decode('utf-8')
    return f'data:image/svg+xml;base64,{b64}'


def get_grr_color(grr_percent: float) -> str:
    """Get classification color based on GRR percentage."""
    if grr_percent < 10:
        return COLORS['success']
    elif grr_percent <= 30:
        return COLORS['warning']
    else:
        return COLORS['danger']


# =============================================================================
# Chart Generation Functions
# =============================================================================

def generate_variation_breakdown_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate horizontal bar chart showing variation breakdown.
    """
    # Filter out GRR Total for the bars
    bar_data = [d for d in data if d['source'] != 'GRR Total']

    chart = pygal.HorizontalBar(
        style=custom_style,
        show_legend=False,
        title='Desglose de Variación',
        x_title='% de Variación Total',
        print_values=True,
        print_values_position='top',
        value_formatter=lambda x: f'{x:.1f}%',
        range=(0, max(100, max(d['percentage'] for d in bar_data) * 1.2)),
        height=300,
        width=600,
    )

    for d in bar_data:
        chart.add(d['source'], [{'value': d['percentage'], 'color': d['color']}])

    return svg_to_base64(chart.render().decode('utf-8'))


def generate_operator_comparison_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate line chart comparing operator means with error indication.
    """
    chart = pygal.Line(
        style=custom_style,
        show_legend=True,
        legend_at_bottom=True,
        title='Comparación de Operadores',
        x_title='Operador',
        y_title='Media',
        print_values=True,
        value_formatter=lambda x: f'{x:.3f}',
        height=300,
        width=600,
        dots_size=6,
    )

    chart.x_labels = [str(d['operator']) for d in data]
    chart.add('Media', [d['mean'] for d in data], stroke_style={'width': 2})

    return svg_to_base64(chart.render().decode('utf-8'))


def generate_r_chart(data: dict[str, Any]) -> str:
    """
    Generate R chart showing all range measurements per operator with control limits.
    """
    points = data['points']
    r_bar = data['rBar']
    ucl_r = data['uclR']
    lcl_r = data['lclR']

    # Group points by operator
    operator_points = defaultdict(list)
    for p in points:
        operator_points[str(p['operator'])].append(p['range'])

    operators = list(operator_points.keys())
    all_ranges = [r for ranges in operator_points.values() for r in ranges]

    # Calculate y range
    max_y = max(max(all_ranges), ucl_r) * 1.2
    min_y = 0

    chart = pygal.Line(
        style=custom_style,
        show_legend=True,
        legend_at_bottom=True,
        title='Gráfico R por Operador',
        x_title='Operador',
        y_title='Rango',
        print_values=False,
        range=(min_y, max_y),
        height=350,
        width=600,
        dots_size=5,
    )

    chart.x_labels = operators

    # Add all measurements as individual series per operator
    for operator in operators:
        ranges = operator_points[operator]
        # Create a series with None for other operators
        series_data = []
        for op in operators:
            if op == operator:
                series_data.extend(ranges)
            else:
                series_data.extend([None] * len(operator_points[op]))
        chart.add(f'{operator}', operator_points[operator], stroke=False)

    # Add control limits as horizontal lines
    chart.add(f'UCL ({ucl_r:.4f})', [ucl_r] * len(operators),
              stroke_style={'width': 1, 'dasharray': '5,5'},
              show_dots=False, fill=False)
    chart.add(f'R̄ ({r_bar:.4f})', [r_bar] * len(operators),
              stroke_style={'width': 1}, show_dots=False, fill=False)
    if lcl_r > 0:
        chart.add(f'LCL ({lcl_r:.4f})', [lcl_r] * len(operators),
                  stroke_style={'width': 1, 'dasharray': '5,5'},
                  show_dots=False, fill=False)

    return svg_to_base64(chart.render().decode('utf-8'))


def generate_xbar_chart(data: dict[str, Any]) -> str:
    """
    Generate X-bar chart showing all mean measurements per operator with control limits.
    """
    points = data['points']
    x_double_bar = data['xDoubleBar']
    ucl = data['uclXBar']
    lcl = data['lclXBar']

    # Group points by operator
    operator_points = defaultdict(list)
    for p in points:
        operator_points[str(p['operator'])].append(p['mean'])

    operators = list(operator_points.keys())
    all_means = [m for means in operator_points.values() for m in means]

    # Calculate y range
    y_min = min(min(all_means), lcl)
    y_max = max(max(all_means), ucl)
    padding = (y_max - y_min) * 0.2

    chart = pygal.Line(
        style=custom_style,
        show_legend=True,
        legend_at_bottom=True,
        title='Gráfico X̄ por Operador',
        x_title='Operador',
        y_title='Media',
        print_values=False,
        range=(y_min - padding, y_max + padding),
        height=350,
        width=600,
        dots_size=5,
    )

    chart.x_labels = operators

    # Add all measurements as individual series per operator
    for operator in operators:
        chart.add(f'{operator}', operator_points[operator], stroke=False)

    # Add control limits
    chart.add(f'UCL ({ucl:.4f})', [ucl] * len(operators),
              stroke_style={'width': 1, 'dasharray': '5,5'},
              show_dots=False, fill=False)
    chart.add(f'X̄ ({x_double_bar:.4f})', [x_double_bar] * len(operators),
              stroke_style={'width': 1}, show_dots=False, fill=False)
    chart.add(f'LCL ({lcl:.4f})', [lcl] * len(operators),
              stroke_style={'width': 1, 'dasharray': '5,5'},
              show_dots=False, fill=False)

    return svg_to_base64(chart.render().decode('utf-8'))


def generate_measurements_by_part_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate box plot of measurements grouped by part.
    """
    chart = pygal.Box(
        style=custom_style,
        show_legend=False,
        title='Mediciones por Parte',
        x_title='Parte',
        y_title='Medición',
        height=300,
        width=600,
    )

    for d in data:
        chart.add(str(d['part']), d['measurements'])

    return svg_to_base64(chart.render().decode('utf-8'))


def generate_measurements_by_operator_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate box plot of measurements grouped by operator.
    """
    chart = pygal.Box(
        style=custom_style,
        show_legend=False,
        title='Mediciones por Operador',
        x_title='Operador',
        y_title='Medición',
        height=300,
        width=600,
    )

    for d in data:
        chart.add(str(d['operator']), d['measurements'])

    return svg_to_base64(chart.render().decode('utf-8'))


def generate_interaction_plot(data: dict[str, Any]) -> str:
    """
    Generate interaction plot (Operator × Part).
    """
    operators_data = data['operators']
    parts = [str(p) for p in data['parts']]

    # Create style with contrast colors
    interaction_style = Style(
        background='white',
        plot_background='white',
        foreground=COLORS['text'],
        foreground_strong=COLORS['text'],
        foreground_subtle=COLORS['muted'],
        colors=CONTRAST_COLORS,
        font_family='sans-serif',
    )

    chart = pygal.Line(
        style=interaction_style,
        show_legend=True,
        legend_at_bottom=True,
        title='Gráfico de Interacción (Operador × Parte)',
        x_title='Parte',
        y_title='Media',
        height=350,
        width=600,
        dots_size=4,
    )

    chart.x_labels = parts

    for op_data in operators_data:
        operator = op_data['operator']
        part_means = op_data['partMeans']
        y_values = [part_means.get(str(p), None) for p in parts]
        chart.add(operator, y_values, stroke_style={'width': 2})

    return svg_to_base64(chart.render().decode('utf-8'))


# =============================================================================
# Main Chart Generation Function
# =============================================================================

def generate_all_charts(chart_data: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Generate all MSA charts as base64 SVG images.

    Args:
        chart_data: List of chart data entries from format_chart_data()

    Returns:
        List of dicts with 'type' and 'image' keys (base64 SVG)
    """
    result = []

    for chart in chart_data:
        chart_type = chart['type']
        data = chart['data']

        try:
            if chart_type == 'variationBreakdown':
                image = generate_variation_breakdown_chart(data)
            elif chart_type == 'operatorComparison':
                image = generate_operator_comparison_chart(data)
            elif chart_type == 'rChartByOperator':
                image = generate_r_chart(data)
            elif chart_type == 'xBarChartByOperator':
                image = generate_xbar_chart(data)
            elif chart_type == 'measurementsByPart':
                image = generate_measurements_by_part_chart(data)
            elif chart_type == 'measurementsByOperator':
                image = generate_measurements_by_operator_chart(data)
            elif chart_type == 'interactionPlot':
                image = generate_interaction_plot(data)
            else:
                # Unknown chart type, skip
                continue

            result.append({
                'type': chart_type,
                'image': image,
            })
        except Exception as e:
            print(f'Error generating {chart_type} chart: {e}')
            # Continue with other charts even if one fails
            continue

    return result
