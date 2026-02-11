"""
Static Chart Generator for MSA Analysis.

Generates PNG images of MSA charts using matplotlib for server-side rendering.
Returns base64-encoded images that can be embedded directly in HTML.
"""
import base64
import io
from typing import Any
from collections import defaultdict

import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np


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

# Chart dimensions
CHART_WIDTH = 8
CHART_HEIGHT = 4
DPI = 150

# Set default font
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 10


# =============================================================================
# Helper Functions
# =============================================================================

def fig_to_base64(fig: plt.Figure) -> str:
    """Convert a matplotlib figure to a base64-encoded PNG string."""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=DPI, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
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
    """
    # Filter out GRR Total for the bars
    bar_data = [d for d in data if d['source'] != 'GRR Total']

    sources = [d['source'] for d in bar_data]
    percentages = [d['percentage'] for d in bar_data]
    colors = [d['color'] for d in bar_data]

    fig, ax = plt.subplots(figsize=(CHART_WIDTH, CHART_HEIGHT))

    y_pos = np.arange(len(sources))
    bars = ax.barh(y_pos, percentages, color=colors, height=0.6)

    # Add value labels
    for i, (bar, pct) in enumerate(zip(bars, percentages)):
        ax.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2,
                f'{pct:.1f}%', va='center', fontsize=9, color=COLORS['text'])

    # Add reference lines at 10% and 30%
    ax.axvline(x=10, color=COLORS['success'], linestyle='--', linewidth=2, label='10%')
    ax.axvline(x=30, color=COLORS['danger'], linestyle='--', linewidth=2, label='30%')

    # Add threshold labels
    ax.text(10, len(sources) - 0.3, '10%', color=COLORS['success'], fontsize=9, ha='center')
    ax.text(30, len(sources) - 0.3, '30%', color=COLORS['danger'], fontsize=9, ha='center')

    ax.set_yticks(y_pos)
    ax.set_yticklabels(sources)
    ax.set_xlabel('% de Variación Total')
    ax.set_xlim(0, max(100, max(percentages) * 1.3))
    ax.set_title('Desglose de Variación', fontsize=12, fontweight='bold')
    ax.grid(axis='x', linestyle='-', alpha=0.3, color=COLORS['grid'])
    ax.set_axisbelow(True)

    plt.tight_layout()
    return fig_to_base64(fig)


def generate_operator_comparison_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate bar chart comparing operator means with error bars.
    """
    operators = [str(d['operator']) for d in data]
    means = [d['mean'] for d in data]
    std_devs = [d['stdDev'] for d in data]

    fig, ax = plt.subplots(figsize=(CHART_WIDTH, CHART_HEIGHT))

    x_pos = np.arange(len(operators))
    bars = ax.bar(x_pos, means, color=COLORS['primary'], width=0.6,
                  yerr=std_devs, capsize=5, error_kw={'color': COLORS['danger'], 'linewidth': 2})

    # Add value labels inside bars
    for bar, mean in zip(bars, means):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() - (bar.get_height() * 0.1),
                f'{mean:.3f}', ha='center', va='top', fontsize=9, color='white', fontweight='bold')

    ax.set_xticks(x_pos)
    ax.set_xticklabels(operators)
    ax.set_xlabel('Operador')
    ax.set_ylabel('Media')
    ax.set_title('Comparación de Operadores', fontsize=12, fontweight='bold')

    # Add subtitle for error bars
    ax.text(0.5, 1.02, 'Barras de error: ±1 Desv. Est.', transform=ax.transAxes,
            ha='center', fontsize=9, color=COLORS['muted'])

    ax.grid(axis='y', linestyle='-', alpha=0.3, color=COLORS['grid'])
    ax.set_axisbelow(True)

    # Adjust y-axis to fit error bars
    max_val = max(m + s for m, s in zip(means, std_devs))
    min_val = min(m - s for m, s in zip(means, std_devs))
    padding = (max_val - min_val) * 0.2
    ax.set_ylim(min_val - padding, max_val + padding)

    plt.tight_layout()
    return fig_to_base64(fig)


def generate_r_chart(data: dict[str, Any]) -> str:
    """
    Generate R chart (average range per operator) with control limits.
    """
    points = data['points']
    r_bar = data['rBar']
    ucl_r = data['uclR']
    lcl_r = data['lclR']

    # Aggregate ranges by operator
    operator_ranges = defaultdict(list)
    for p in points:
        operator_ranges[str(p['operator'])].append(p['range'])

    operators = list(operator_ranges.keys())
    avg_ranges = [sum(ranges) / len(ranges) for ranges in operator_ranges.values()]

    fig, ax = plt.subplots(figsize=(CHART_WIDTH, CHART_HEIGHT))

    x_pos = np.arange(len(operators))

    # Plot control limits
    ax.axhline(y=ucl_r, color=COLORS['danger'], linestyle='--', linewidth=1.5)
    ax.axhline(y=r_bar, color=COLORS['success'], linestyle='-', linewidth=1.5)
    if lcl_r > 0:
        ax.axhline(y=lcl_r, color=COLORS['danger'], linestyle='--', linewidth=1.5)

    # Plot data line
    ax.plot(x_pos, avg_ranges, 'o-', color=COLORS['primary'], linewidth=2,
            markersize=10, markerfacecolor=COLORS['primary'])

    # Add data point labels
    for i, (x, val) in enumerate(zip(x_pos, avg_ranges)):
        ax.annotate(f'{val:.4f}', (x, val), textcoords="offset points",
                    xytext=(0, 12), ha='center', fontsize=9, color=COLORS['text'],
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=COLORS['grid']))

    # Add control limit labels on the right
    ax.text(len(operators) - 0.5, ucl_r, f'UCL: {ucl_r:.4f}', va='center', fontsize=9,
            color=COLORS['danger'], bbox=dict(facecolor='white', edgecolor='none', pad=1))
    ax.text(len(operators) - 0.5, r_bar, f'R̄: {r_bar:.4f}', va='center', fontsize=9,
            color=COLORS['success'], bbox=dict(facecolor='white', edgecolor='none', pad=1))
    if lcl_r > 0:
        ax.text(len(operators) - 0.5, lcl_r, f'LCL: {lcl_r:.4f}', va='center', fontsize=9,
                color=COLORS['danger'], bbox=dict(facecolor='white', edgecolor='none', pad=1))

    ax.set_xticks(x_pos)
    ax.set_xticklabels(operators)
    ax.set_xlabel('Operador')
    ax.set_ylabel('Rango Promedio')
    ax.set_title('Gráfico R por Operador', fontsize=12, fontweight='bold')
    ax.grid(axis='y', linestyle='-', alpha=0.3, color=COLORS['grid'])
    ax.set_axisbelow(True)

    # Set y-axis range
    max_y = max(max(avg_ranges), ucl_r) * 1.25
    ax.set_ylim(0, max_y)
    ax.set_xlim(-0.5, len(operators) + 0.5)

    plt.tight_layout()
    return fig_to_base64(fig)


def generate_xbar_chart(data: dict[str, Any]) -> str:
    """
    Generate X-bar chart (mean per operator) with control limits.
    """
    points = data['points']
    x_double_bar = data['xDoubleBar']
    ucl = data['uclXBar']
    lcl = data['lclXBar']

    # Aggregate means by operator
    operator_means = defaultdict(list)
    for p in points:
        operator_means[str(p['operator'])].append(p['mean'])

    operators = list(operator_means.keys())
    avg_means = [sum(means) / len(means) for means in operator_means.values()]

    fig, ax = plt.subplots(figsize=(CHART_WIDTH, CHART_HEIGHT))

    x_pos = np.arange(len(operators))

    # Plot control limits
    ax.axhline(y=ucl, color=COLORS['danger'], linestyle='--', linewidth=1.5)
    ax.axhline(y=x_double_bar, color=COLORS['success'], linestyle='-', linewidth=1.5)
    ax.axhline(y=lcl, color=COLORS['danger'], linestyle='--', linewidth=1.5)

    # Plot data line
    ax.plot(x_pos, avg_means, 'o-', color=COLORS['primary'], linewidth=2,
            markersize=10, markerfacecolor=COLORS['primary'])

    # Add data point labels
    for i, (x, val) in enumerate(zip(x_pos, avg_means)):
        ax.annotate(f'{val:.4f}', (x, val), textcoords="offset points",
                    xytext=(0, 12), ha='center', fontsize=9, color=COLORS['text'],
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=COLORS['grid']))

    # Add control limit labels on the right
    ax.text(len(operators) - 0.5, ucl, f'UCL: {ucl:.4f}', va='center', fontsize=9,
            color=COLORS['danger'], bbox=dict(facecolor='white', edgecolor='none', pad=1))
    ax.text(len(operators) - 0.5, x_double_bar, f'X̄: {x_double_bar:.4f}', va='center', fontsize=9,
            color=COLORS['success'], bbox=dict(facecolor='white', edgecolor='none', pad=1))
    ax.text(len(operators) - 0.5, lcl, f'LCL: {lcl:.4f}', va='center', fontsize=9,
            color=COLORS['danger'], bbox=dict(facecolor='white', edgecolor='none', pad=1))

    ax.set_xticks(x_pos)
    ax.set_xticklabels(operators)
    ax.set_xlabel('Operador')
    ax.set_ylabel('Media')
    ax.set_title('Gráfico X̄ por Operador', fontsize=12, fontweight='bold')
    ax.grid(axis='y', linestyle='-', alpha=0.3, color=COLORS['grid'])
    ax.set_axisbelow(True)

    # Set y-axis range
    y_min = min(min(avg_means), lcl)
    y_max = max(max(avg_means), ucl)
    padding = (y_max - y_min) * 0.25
    ax.set_ylim(y_min - padding, y_max + padding)
    ax.set_xlim(-0.5, len(operators) + 0.5)

    plt.tight_layout()
    return fig_to_base64(fig)


def generate_measurements_by_part_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate box plot of measurements grouped by part.
    """
    fig, ax = plt.subplots(figsize=(CHART_WIDTH, CHART_HEIGHT))

    parts = [str(d['part']) for d in data]
    measurements = [d['measurements'] for d in data]

    bp = ax.boxplot(measurements, labels=parts, patch_artist=True, showmeans=True,
                    meanprops=dict(marker='D', markerfacecolor='white', markeredgecolor='black', markersize=6))

    # Color the boxes
    colors_list = plt.cm.Set2(np.linspace(0, 1, len(parts)))
    for patch, color in zip(bp['boxes'], colors_list):
        patch.set_facecolor(color)

    ax.set_xlabel('Parte')
    ax.set_ylabel('Medición')
    ax.set_title('Mediciones por Parte', fontsize=12, fontweight='bold')
    ax.grid(axis='y', linestyle='-', alpha=0.3, color=COLORS['grid'])
    ax.set_axisbelow(True)

    plt.tight_layout()
    return fig_to_base64(fig)


def generate_measurements_by_operator_chart(data: list[dict[str, Any]]) -> str:
    """
    Generate box plot of measurements grouped by operator.
    """
    fig, ax = plt.subplots(figsize=(CHART_WIDTH, CHART_HEIGHT))

    operators = [str(d['operator']) for d in data]
    measurements = [d['measurements'] for d in data]

    bp = ax.boxplot(measurements, labels=operators, patch_artist=True, showmeans=True,
                    meanprops=dict(marker='D', markerfacecolor='white', markeredgecolor='black', markersize=6))

    # Color the boxes
    colors_list = plt.cm.Set2(np.linspace(0, 1, len(operators)))
    for patch, color in zip(bp['boxes'], colors_list):
        patch.set_facecolor(color)

    ax.set_xlabel('Operador')
    ax.set_ylabel('Medición')
    ax.set_title('Mediciones por Operador', fontsize=12, fontweight='bold')
    ax.grid(axis='y', linestyle='-', alpha=0.3, color=COLORS['grid'])
    ax.set_axisbelow(True)

    plt.tight_layout()
    return fig_to_base64(fig)


def generate_interaction_plot(data: dict[str, Any]) -> str:
    """
    Generate interaction plot (Operator × Part).
    """
    operators_data = data['operators']
    parts = [str(p) for p in data['parts']]

    fig, ax = plt.subplots(figsize=(CHART_WIDTH, CHART_HEIGHT))

    x_pos = np.arange(len(parts))

    for i, op_data in enumerate(operators_data):
        operator = op_data['operator']
        part_means = op_data['partMeans']
        color = CONTRAST_COLORS[i % len(CONTRAST_COLORS)]

        # Get means in order of parts
        y_values = [part_means.get(str(p), None) for p in parts]

        ax.plot(x_pos, y_values, 'o-', color=color, linewidth=2.5,
                markersize=8, label=operator, markerfacecolor=color)

    ax.set_xticks(x_pos)
    ax.set_xticklabels(parts)
    ax.set_xlabel('Parte')
    ax.set_ylabel('Media')
    ax.set_title('Gráfico de Interacción (Operador × Parte)', fontsize=12, fontweight='bold')
    ax.legend(title='Operador', loc='upper center', bbox_to_anchor=(0.5, -0.15),
              ncol=len(operators_data), fontsize=9)
    ax.grid(axis='y', linestyle='-', alpha=0.3, color=COLORS['grid'])
    ax.set_axisbelow(True)

    plt.tight_layout()
    return fig_to_base64(fig)


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
