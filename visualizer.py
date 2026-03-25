import matplotlib.pyplot as plt
import re

COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7',
          '#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9']

def extract_numbers(text):
    """Extract label:value pairs from LLM expense response."""
    data = {}

    # Pattern 1: "January 2024: 22429" or "Food and Dining: 47800"
    pattern1 = re.findall(r'([A-Za-z][\w &/\-]+?\d{0,4})\s*[:\-]\s*(?:Rs\.?\s*)?([\d,]+)', text)
    for label, value in pattern1:
        label = label.strip()
        value = float(value.replace(",", ""))
        if value > 0 and len(label) > 2:
            data[label] = value

    # Pattern 2: "Rs 22,429" with nearby label on same line
    pattern2 = re.findall(r'([A-Za-z][\w &/\-]{2,30})\s+(?:was|is|:)\s+Rs\s*([\d,]+)', text)
    for label, value in pattern2:
        label = label.strip()
        value = float(value.replace(",", ""))
        if value > 0:
            data[label] = value

    # Pattern 3: percentage breakdown "Food and Dining 13.94 percent"
    pattern3 = re.findall(r'([A-Za-z][\w &/\-]{2,30})\s+([\d]+\.?\d*)\s*percent', text)
    for label, value in pattern3:
        label = label.strip()
        if float(value) > 0:
            data[label] = float(value)

    return data

def pick_chart_type(text):
    """Pick best chart type based on question context."""
    text_lower = text.lower()
    if any(w in text_lower for w in ["trend", "monthly", "month by month", "over time", "quarterly", "each month"]):
        return "line"
    elif any(w in text_lower for w in ["breakdown", "distribution", "percentage", "share", "percent", "category"]):
        return "pie"
    elif any(w in text_lower for w in ["compare", "comparison", "vs", "top", "highest", "ranking"]):
        return "bar"
    else:
        return "bar"

def plot_bar(data, title="Personal Expenses 2024"):
    labels = list(data.keys())[:10]
    values = [data[l] for l in labels]

    fig, ax = plt.subplots(figsize=(11, 5))
    bars = ax.bar(labels, values, color=COLORS[:len(labels)], edgecolor='white', linewidth=1.2)

    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 100,
                f'Rs {val:,.0f}', ha='center', va='bottom', fontsize=8)

    ax.set_title(title, fontsize=13, fontweight='bold', pad=15)
    ax.set_ylabel("Amount (Rs)")
    plt.xticks(rotation=30, ha='right')
    plt.tight_layout()
    plt.show()

def plot_pie(data, title="Expense Breakdown 2024"):
    labels = list(data.keys())[:8]
    values = [data[l] for l in labels]

    fig, ax = plt.subplots(figsize=(8, 6))
    wedges, texts, autotexts = ax.pie(
        values, labels=labels, autopct='%1.1f%%',
        colors=COLORS[:len(labels)], startangle=140,
        wedgeprops=dict(edgecolor='white', linewidth=2)
    )
    for t in autotexts:
        t.set_fontsize(9)
    ax.set_title(title, fontsize=13, fontweight='bold')
    plt.tight_layout()
    plt.show()

def plot_line(data, title="Monthly Expense Trend 2024"):
    labels = list(data.keys())[:12]
    values = [data[l] for l in labels]

    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot(labels, values, marker='o', color='#4ECDC4',
            linewidth=2.5, markersize=8, markerfacecolor='#FF6B6B')
    ax.fill_between(labels, values, alpha=0.15, color='#4ECDC4')

    for label, val in zip(labels, values):
        ax.annotate(f'Rs {val:,.0f}', (label, val),
                    textcoords="offset points", xytext=(0, 10),
                    ha='center', fontsize=8)

    ax.set_title(title, fontsize=13, fontweight='bold')
    ax.set_ylabel("Amount (Rs)")
    plt.xticks(rotation=30, ha='right')
    plt.tight_layout()
    plt.show()

def visualize_response(response_text, question=""):
    """Extract numbers from LLM response and plot them."""
    print("\n🔍 Extracting data from response...")
    data = extract_numbers(response_text)

    if not data:
        print("⚠️  No numeric data found to visualize.")
        print("    Try asking questions that include specific amounts or categories.")
        return

    # Filter out noise — skip values that look like years or tiny numbers
    data = {k: v for k, v in data.items() if v > 500}

    if not data:
        print("⚠️  Data found but values too small to plot meaningfully.")
        return

    print(f"✅ Found {len(data)} data points: {list(data.keys())}")

    chart_type = pick_chart_type(question + " " + response_text)
    title = question[:65] if question else "Personal Expenses 2024"
    print(f"📊 Plotting {chart_type} chart...")

    if chart_type == "line":
        plot_line(data, title)
    elif chart_type == "pie":
        plot_pie(data, title)
    else:
        plot_bar(data, title)


