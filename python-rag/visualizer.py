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
