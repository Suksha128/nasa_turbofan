import os
os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib_cache'
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Compact, perfectly proportioned figure for Word / IEEE paper
fig, ax = plt.subplots(figsize=(6.8, 10.2), dpi=350)
fig.patch.set_facecolor('none')
fig.patch.set_alpha(0.0)
ax.set_facecolor('none')

ax.set_xlim(0, 10)
ax.set_ylim(0, 14.0)
ax.axis('off')

# Font styles
font_title = {'fontsize': 11.2, 'fontweight': 'bold', 'color': 'black', 'family': 'sans-serif'}
font_math = {'fontsize': 9.6, 'fontstyle': 'italic', 'color': 'black', 'family': 'serif'}
font_badge = {'fontsize': 8.6, 'fontweight': 'bold', 'color': 'black', 'family': 'sans-serif'}

def draw_simple_box(y_center, stage_num, title, math_str, height=1.22, width=7.4):
    x_left = (10.0 - width) / 2.0
    y_bottom = y_center - height / 2.0
    
    # Outer box: crisp black border, solid white interior
    rect = patches.FancyBboxPatch((x_left, y_bottom), width, height,
                                  boxstyle="round,pad=0.0,rounding_size=0.18",
                                  ec="black", fc="white", lw=1.8)
    ax.add_patch(rect)
    
    # Top text: Stage Number and Title
    header_text = f"Stage {stage_num}:  {title}"
    ax.text(5.0, y_center + 0.24, header_text, fontdict=font_title, va='center', ha='center')
    
    # Bottom text: Core Mathematical Formulation / Notation
    ax.text(5.0, y_center - 0.24, math_str, fontdict=font_math, va='center', ha='center')

def draw_clean_arrow(y_start, y_end, data_label=None):
    ax.annotate('', xy=(5.0, y_end), xytext=(5.0, y_start),
                arrowprops=dict(facecolor='black', edgecolor='black', width=1.5, headwidth=6.5, headlength=6.5))
    if data_label:
        y_mid = (y_start + y_end) / 2.0
        ax.text(5.0, y_mid, data_label, fontdict=font_badge, ha='center', va='center',
                bbox=dict(boxstyle="round,pad=0.22", ec="black", fc="white", lw=1.0))

# 6 Stages with y centers evenly spaced
box_h = 1.22

# Stage 1
draw_simple_box(12.7, "1", "Sensor Telemetry Acquisition",
                r"$\mathbf{x}_t = [c_t,\; o_{1..3,t},\; s_{1..21,t}]^T \;\in\; \mathbb{R}^{25}$", height=box_h)

draw_clean_arrow(12.7 - box_h/2, 10.4 + box_h/2, r"$\mathbf{x}_t \;\in\; \mathbb{R}^{25}$")

# Stage 2
draw_simple_box(10.4, "2", "Zero-Variance Channel Pruning",
                r"$\tilde{\mathbf{x}}_t \;\in\; \mathbb{R}^{18} \quad (\sigma^2 < 10^{-4} \;\to\; \mathrm{Drop\; 7\; Flatline\; Sensors})$", height=box_h)

draw_clean_arrow(10.4 - box_h/2, 8.1 + box_h/2, r"$\tilde{\mathbf{x}}_t \;\in\; \mathbb{R}^{18}$")

# Stage 3
draw_simple_box(8.1, "3", "Temporal Rolling Feature Extraction",
                r"$\boldsymbol{\phi}_t = [\mathbf{s}_{\mathrm{active},t},\; \bar{\mathbf{s}}_t,\; \boldsymbol{\sigma}_t]^T \;\in\; \mathbb{R}^{42} \quad (w = 5 \text{ Cycles})$", height=box_h)

draw_clean_arrow(8.1 - box_h/2, 5.8 + box_h/2, r"$\tilde{\boldsymbol{\phi}}_t \;\in\; [0, 1]^{42}$")

# Stage 4
draw_simple_box(5.8, "4", "Piecewise Target & Degradation Factor",
                r"$y_t = \min(125,\, T_{\max} - t) \quad \mid \quad \Delta_{\mathrm{deg}} = 0.35\delta_{\mathrm{Ps30}} + 0.30\delta_{T30} + \dots$", height=box_h)

draw_clean_arrow(5.8 - box_h/2, 3.5 + box_h/2, r"$\left(\tilde{\boldsymbol{\phi}}_{t-L+1:t},\; y_t\right)$")

# Stage 5
draw_simple_box(3.5, "5", "Surrogate ML / 2-Layer LSTM Inference",
                r"$\hat{y}_t = \mathbf{W}_2 \mathrm{ReLU}(\mathbf{W}_1 \mathbf{H}_t^{(2)} + \mathbf{b}_1) + b_2 \quad (\mathrm{RMSE} = 13.47)$", height=box_h)

draw_clean_arrow(3.5 - box_h/2, 1.2 + box_h/2, r"$\hat{y}_t \;\mathrm{(Predicted\; RUL)}$")

# Stage 6
draw_simple_box(1.2, "6", "NASA Asymmetric Loss & ERP Dispatch",
                r"$S = \sum s_i \;\; (1.75\times \mathrm{Late\; Penalty}) \quad \rightarrow \quad \mathcal{A}_t \in \{\mathrm{Routine,\; Watch,\; Critical}\}$", height=box_h)

# Save output files
out_file = "/Users/sukshas/.gemini/antigravity/scratch/cmapss-pdm-dashboard/public/framework_flowchart.png"
docs_file = "/Users/sukshas/.gemini/antigravity/scratch/cmapss-pdm-dashboard/docs/framework_flowchart.png"
artifact_file = "/Users/sukshas/.gemini/antigravity/brain/d9aee1ac-bc70-4a03-8c54-2b525fbd1c56/framework_flowchart.png"

plt.tight_layout()
plt.savefig(out_file, transparent=True, dpi=350, bbox_inches='tight')
import shutil
shutil.copy(out_file, docs_file)
shutil.copy(out_file, artifact_file)
print("Optimized simple flowchart generated successfully!")
