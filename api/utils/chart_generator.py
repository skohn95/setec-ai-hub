"""
Static Chart Generator for MSA Analysis.

Generates PNG images of MSA charts using Plotly for server-side rendering.
Returns base64-encoded images that can be embedded directly in HTML.
"""
import base64
import io
from typing import Any

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots


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

# Chart dimensions
CHART_WIDTH = 600
CHART_HEIGHT = 300
CHART_HEIGHT_SMALL = 250

# Common layout settings (without margin - set per chart)
BASE_LAYOUT = {
    'paper_bgcolor': COLORS['background'],
    'plot_bgcolor': COLORS['background'],
    'font': {'family': 'Inter, system-ui, sans-serif', 'size': 12, 'color': COLORS['text']},
}

# Default margin
DEFAULT_MARGIN = {'l': 60, 'r': 30, 't': 50, 'b': 50}


# =============================================================================
# Helper Functions
# =============================================================================

def fig_to_base64(fig: go.Figure, width: int = CHART_WIDTH, height: int = CHART_HEIGHT) -> str:
    """Convert a Plotly figure to a base64-encoded PNG string."""
    img_bytes = fig.to_image(format='png', width=width, height=height, scale=2)
    b64 = base64.b64encode(img_bytes).decode('utf-8')
    return f'data:image/png;base64,{b64}'


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

    Args:
        data: List of dicts with 'source', 'percentage', 'color' keys

    Returns:
        Base64-encoded PNG image
    """
    # Filter out GRR Total for the bars (we'll show it separately)
    bar_data = [d for d in data if d['source'] != 'GRR Total']
    grr_total = next((d for d in data if d['source'] == 'GRR Total'), None)

    sources = [d['source'] for d in bar_data]
    percentages = [d['percentage'] for d in bar_data]
    colors = [d['color'] for d in bar_data]

    fig = go.Figure()

    # Add horizontal bars
    fig.add_trace(go.Bar(
        y=sources,
        x=percentages,
        orientation='h',
        marker_color=colors,
        text=[f'{p:.1f}%' for p in percentages],
        textposition='outside',
        textfont={'size': 11},
    ))

    # Add reference lines at 10% and 30%
    fig.add_vline(x=10, line_dash='dash', line_color=COLORS['success'], line_width=2)
    fig.add_vline(x=30, line_dash='dash', line_color=COLORS['danger'], line_width=2)

    # Add annotations for thresholds (offset to the right to avoid overlapping with lines)
    fig.add_annotation(x=10, y=1.08, yref='paper', text='10%', showarrow=False,
                       font={'size': 10, 'color': COLORS['success']}, xshift=12)
    fig.add_annotation(x=30, y=1.08, yref='paper', text='30%', showarrow=False,
                       font={'size': 10, 'color': COLORS['danger']}, xshift=12)

    # Update layout
    fig.update_layout(
        **BASE_LAYOUT,
        title={'text': 'Desglose de Variación', 'x': 0.5, 'xanchor': 'center'},
        xaxis={'title': '% de Variación Total', 'range': [0, max(100, max(percentages) * 1.2)],
               'gridcolor': COLORS['grid'], 'showgrid': True},
        yaxis={'title': '', 'categoryorder': 'total ascending'},
        showlegend=False,
        bargap=0.3,
        margin={'l': 100, 'r': 50, 't': 50, 'b': 60},
    )

    return fig_to_base64(fig, height=CHART_HEIGHT)


def generate_operator_comparison_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate bar chart comparing operator means with error bars.

    Args:
        data: List of dicts with 'operator', 'mean', 'stdDev' keys

    Returns:
        Base64-encoded PNG image
    """
    operators = [d['operator'] for d in data]
    means = [d['mean'] for d in data]
    std_devs = [d['stdDev'] for d in data]

    # Calculate y-axis range to fit error bars
    max_val = max(m + s for m, s in zip(means, std_devs))
    min_val = min(m - s for m, s in zip(means, std_devs))
    y_padding = (max_val - min_val) * 0.2
    y_range = [min_val - y_padding, max_val + y_padding]

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=operators,
        y=means,
        marker_color=COLORS['primary'],
        error_y={
            'type': 'data',
            'array': std_devs,
            'visible': True,
            'color': COLORS['danger'],
            'thickness': 2,
            'width': 8,
        },
        text=[f'{m:.3f}' for m in means],
        textposition='inside',
        textfont={'size': 10, 'color': 'white'},
    ))

    fig.update_layout(
        **BASE_LAYOUT,
        title={'text': 'Comparación de Operadores', 'x': 0.5, 'xanchor': 'center'},
        xaxis={'title': 'Operador', 'gridcolor': COLORS['grid']},
        yaxis={'title': 'Media', 'gridcolor': COLORS['grid'], 'showgrid': True, 'range': y_range},
        showlegend=False,
        bargap=0.4,
        margin={'l': 60, 'r': 30, 't': 60, 'b': 50},
    )

    # Add legend for error bars below title
    fig.add_annotation(
        x=0.5, y=1.08, xref='paper', yref='paper',
        text='Barras de error: ±1 Desv. Est.',
        showarrow=False,
        font={'size': 10, 'color': COLORS['muted']},
        xanchor='center',
    )

    return fig_to_base64(fig, height=CHART_HEIGHT)


def generate_r_chart(data: dict[str, Any]) -> str:
    """
    Generate R chart (average range per operator) with control limits.

    Args:
        data: Dict with 'points', 'rBar', 'uclR', 'lclR' keys

    Returns:
        Base64-encoded PNG image
    """
    points = data['points']
    r_bar = data['rBar']
    ucl_r = data['uclR']
    lcl_r = data['lclR']

    # Aggregate ranges by operator (average range per operator)
    from collections import defaultdict
    operator_ranges = defaultdict(list)
    for p in points:
        operator_ranges[p['operator']].append(p['range'])

    # Calculate average range per operator (convert keys to strings for consistency)
    operators = [str(k) for k in operator_ranges.keys()]
    avg_ranges = [sum(ranges) / len(ranges) for ranges in operator_ranges.values()]

    fig = go.Figure()

    # Add data line FIRST (so control limits draw on top for visibility)
    fig.add_trace(go.Scatter(
        x=operators,
        y=avg_ranges,
        mode='markers+lines+text',
        name='Rango Promedio',
        marker={'color': COLORS['primary'], 'size': 12},
        line={'color': COLORS['primary'], 'width': 2},
        text=[f'{v:.4f}' for v in avg_ranges],
        textposition='top center',
        textfont={'size': 10, 'color': COLORS['text']},
        showlegend=True,
    ))

    # Add control limits as horizontal lines
    fig.add_hline(y=ucl_r, line_dash='dash', line_color=COLORS['danger'], line_width=1.5)
    fig.add_hline(y=r_bar, line_dash='solid', line_color=COLORS['success'], line_width=1.5)
    if lcl_r > 0:
        fig.add_hline(y=lcl_r, line_dash='dash', line_color=COLORS['danger'], line_width=1.5)

    # Calculate y-range to fit labels and control limits
    max_y = max(max(avg_ranges), ucl_r) * 1.35

    fig.update_layout(
        **BASE_LAYOUT,
        title={'text': 'Gráfico R por Operador', 'x': 0.5, 'xanchor': 'center'},
        xaxis={'title': 'Operador', 'gridcolor': COLORS['grid']},
        yaxis={'title': 'Rango Promedio', 'gridcolor': COLORS['grid'], 'showgrid': True,
               'range': [0, max_y]},
        showlegend=False,
        margin={'l': 60, 'r': 100, 't': 60, 'b': 50},
    )

    # Add control limit labels on the lines at the right edge of the plot
    fig.add_annotation(
        x=0.99, y=ucl_r, xref='paper', yref='y',
        text=f'UCL: {ucl_r:.4f}', showarrow=False,
        font={'size': 9, 'color': COLORS['danger']},
        xanchor='left', yanchor='middle',
        bgcolor='white', borderpad=2,
    )
    fig.add_annotation(
        x=0.99, y=r_bar, xref='paper', yref='y',
        text=f'R\u0305: {r_bar:.4f}', showarrow=False,
        font={'size': 9, 'color': COLORS['success']},
        xanchor='left', yanchor='middle',
        bgcolor='white', borderpad=2,
    )
    if lcl_r > 0:
        fig.add_annotation(
            x=0.99, y=lcl_r, xref='paper', yref='y',
            text=f'LCL: {lcl_r:.4f}', showarrow=False,
            font={'size': 9, 'color': COLORS['danger']},
            xanchor='left', yanchor='middle',
            bgcolor='white', borderpad=2,
        )

    return fig_to_base64(fig, height=CHART_HEIGHT)


def generate_xbar_chart(data: dict[str, Any]) -> str:
    """
    Generate X-bar chart (mean per operator) with control limits.

    Args:
        data: Dict with 'points', 'xDoubleBar', 'uclXBar', 'lclXBar' keys

    Returns:
        Base64-encoded PNG image
    """
    points = data['points']
    x_double_bar = data['xDoubleBar']
    ucl = data['uclXBar']
    lcl = data['lclXBar']

    # Aggregate means by operator (average of means per operator)
    from collections import defaultdict
    operator_means = defaultdict(list)
    for p in points:
        operator_means[p['operator']].append(p['mean'])

    # Calculate average mean per operator (convert keys to strings for consistency)
    operators = [str(k) for k in operator_means.keys()]
    avg_means = [sum(means) / len(means) for means in operator_means.values()]

    fig = go.Figure()

    # Add data line FIRST (so control limits draw on top for visibility)
    fig.add_trace(go.Scatter(
        x=operators,
        y=avg_means,
        mode='markers+lines+text',
        name='Media',
        marker={'color': COLORS['primary'], 'size': 12},
        line={'color': COLORS['primary'], 'width': 2},
        text=[f'{v:.4f}' for v in avg_means],
        textposition='top center',
        textfont={'size': 10, 'color': COLORS['text']},
        showlegend=True,
    ))

    # Add control limits as horizontal lines
    fig.add_hline(y=ucl, line_dash='dash', line_color=COLORS['danger'], line_width=1.5)
    fig.add_hline(y=x_double_bar, line_dash='solid', line_color=COLORS['success'], line_width=1.5)
    fig.add_hline(y=lcl, line_dash='dash', line_color=COLORS['danger'], line_width=1.5)

    # Calculate y-range to fit labels and control limits
    y_min = min(min(avg_means), lcl)
    y_max = max(max(avg_means), ucl)
    y_padding = (y_max - y_min) * 0.35
    y_range = [y_min - y_padding, y_max + y_padding]

    fig.update_layout(
        **BASE_LAYOUT,
        title={'text': u'Gráfico X\u0305 por Operador', 'x': 0.5, 'xanchor': 'center'},
        xaxis={'title': 'Operador', 'gridcolor': COLORS['grid']},
        yaxis={'title': 'Media', 'gridcolor': COLORS['grid'], 'showgrid': True,
               'range': y_range},
        showlegend=False,
        margin={'l': 60, 'r': 100, 't': 60, 'b': 50},
    )

    # Add control limit labels on the lines at the right edge of the plot
    fig.add_annotation(
        x=0.99, y=ucl, xref='paper', yref='y',
        text=f'UCL: {ucl:.4f}', showarrow=False,
        font={'size': 9, 'color': COLORS['danger']},
        xanchor='left', yanchor='middle',
        bgcolor='white', borderpad=2,
    )
    fig.add_annotation(
        x=0.99, y=x_double_bar, xref='paper', yref='y',
        text=f'X\u0305: {x_double_bar:.4f}', showarrow=False,
        font={'size': 9, 'color': COLORS['success']},
        xanchor='left', yanchor='middle',
        bgcolor='white', borderpad=2,
    )
    fig.add_annotation(
        x=0.99, y=lcl, xref='paper', yref='y',
        text=f'LCL: {lcl:.4f}', showarrow=False,
        font={'size': 9, 'color': COLORS['danger']},
        xanchor='left', yanchor='middle',
        bgcolor='white', borderpad=2,
    )

    return fig_to_base64(fig, height=CHART_HEIGHT)


def generate_measurements_by_part_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate box plot of measurements grouped by part.

    Args:
        data: List of dicts with 'part', 'measurements', 'mean', 'min', 'max' keys

    Returns:
        Base64-encoded PNG image
    """
    fig = go.Figure()

    for i, part_data in enumerate(data):
        fig.add_trace(go.Box(
            y=part_data['measurements'],
            name=str(part_data['part']),
            marker_color=px.colors.qualitative.Set2[i % len(px.colors.qualitative.Set2)],
            boxmean=True,
        ))

    fig.update_layout(
        **BASE_LAYOUT,
        title={'text': 'Mediciones por Parte', 'x': 0.5, 'xanchor': 'center'},
        xaxis={'title': 'Parte', 'gridcolor': COLORS['grid']},
        yaxis={'title': 'Medición', 'gridcolor': COLORS['grid'], 'showgrid': True},
        showlegend=False,
        margin=DEFAULT_MARGIN,
    )

    return fig_to_base64(fig, height=CHART_HEIGHT)


def generate_measurements_by_operator_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate box plot of measurements grouped by operator.

    Args:
        data: List of dicts with 'operator', 'measurements', 'mean', 'min', 'max' keys

    Returns:
        Base64-encoded PNG image
    """
    fig = go.Figure()

    for i, op_data in enumerate(data):
        fig.add_trace(go.Box(
            y=op_data['measurements'],
            name=str(op_data['operator']),
            marker_color=px.colors.qualitative.Set2[i % len(px.colors.qualitative.Set2)],
            boxmean=True,
        ))

    fig.update_layout(
        **BASE_LAYOUT,
        title={'text': 'Mediciones por Operador', 'x': 0.5, 'xanchor': 'center'},
        xaxis={'title': 'Operador', 'gridcolor': COLORS['grid']},
        yaxis={'title': 'Medición', 'gridcolor': COLORS['grid'], 'showgrid': True},
        showlegend=False,
        margin=DEFAULT_MARGIN,
    )

    return fig_to_base64(fig, height=CHART_HEIGHT)


def generate_interaction_plot(data: dict[str, Any]) -> str:
    """
    Generate interaction plot (Operator × Part).

    Args:
        data: Dict with 'operators' (list of {operator, partMeans}) and 'parts' (list of part names)

    Returns:
        Base64-encoded PNG image
    """
    operators_data = data['operators']
    parts = data['parts']

    # High contrast colors for operators
    CONTRAST_COLORS = [
        '#E63946',  # Red
        '#1D3557',  # Dark Blue
        '#2A9D8F',  # Teal
        '#F4A261',  # Orange
        '#9B5DE5',  # Purple
        '#00F5D4',  # Cyan
    ]

    fig = go.Figure()

    for i, op_data in enumerate(operators_data):
        operator = op_data['operator']
        part_means = op_data['partMeans']
        color = CONTRAST_COLORS[i % len(CONTRAST_COLORS)]

        # Get means in order of parts
        y_values = [part_means.get(str(p), None) for p in parts]

        fig.add_trace(go.Scatter(
            x=parts,
            y=y_values,
            mode='markers+lines',
            name=operator,
            marker={'size': 10, 'color': color},
            line={'width': 3, 'color': color},
        ))

    fig.update_layout(
        **BASE_LAYOUT,
        title={'text': 'Gráfico de Interacción (Operador × Parte)', 'x': 0.5, 'xanchor': 'center'},
        xaxis={'title': 'Parte', 'gridcolor': COLORS['grid']},
        yaxis={'title': 'Media', 'gridcolor': COLORS['grid'], 'showgrid': True},
        legend={'title': 'Operador', 'orientation': 'h', 'yanchor': 'top',
                'y': -0.25, 'xanchor': 'center', 'x': 0.5},
        margin={'l': 60, 'r': 30, 't': 50, 'b': 100},
    )

    return fig_to_base64(fig, height=350)


# =============================================================================
# Main Chart Generation Function
# =============================================================================

def generate_all_charts(chart_data: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Generate all MSA charts as base64 PNG images.

    Args:
        chart_data: List of chart data entries from format_chart_data()

    Returns:
        List of dicts with 'type' and 'image' keys (base64 PNG)
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
