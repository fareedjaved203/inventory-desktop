# Label Printing Configuration Guide

## Available Label Sizes

### 1. Extra Small (1" × 0.5")
- **Use Case**: Tiny items, jewelry, small electronics
- **Barcode Printer**: Perfect for Zebra GK420d, Brother QL-570
- **A4 Paper**: 80 labels per page (10×8 grid)

### 2. Small (1.5" × 1")
- **Use Case**: Small retail items, cosmetics, accessories
- **Barcode Printer**: Compatible with most thermal printers
- **A4 Paper**: 35 labels per page (7×5 grid)

### 3. Medium (2.25" × 1.25") - **RECOMMENDED**
- **Use Case**: Standard retail products, books, boxes
- **Barcode Printer**: Standard size for most label printers
- **A4 Paper**: 24 labels per page (6×4 grid)

### 4. Large (3" × 2")
- **Use Case**: Large items, appliances, furniture
- **Barcode Printer**: Requires wide-format printers
- **A4 Paper**: 12 labels per page (4×3 grid)

### 5. Extra Large (4" × 3")
- **Use Case**: Very large items, warehouse storage
- **Barcode Printer**: Industrial printers only
- **A4 Paper**: 6 labels per page (3×2 grid)

## Print Settings Configuration

### For Barcode Printers (Thermal/Direct)

#### Zebra Printers (GK420d, ZD410, etc.)
```
Paper Size: Custom
Width: [Selected label width]
Height: [Selected label height]
Print Quality: 203 DPI (minimum) / 300 DPI (recommended)
Print Speed: Medium (4 ips)
Darkness: 10-15 (adjust based on label material)
```

#### Brother Label Printers (QL series)
```
Paper Type: Die-cut labels
Size: Custom size matching selected dimensions
Quality: Best (300×600 DPI)
Auto-cut: On (for individual labels)
```

#### Dymo LabelWriter
```
Label Type: Custom
Dimensions: Match selected size exactly
Print Quality: Auto
Alignment: Center
```

### For A4 Paper Printing

#### Laser/Inkjet Printer Settings
```
Paper Size: A4 (8.27" × 11.69")
Print Quality: High (600 DPI minimum)
Scale: 100% (DO NOT scale to fit)
Margins: 0.5" all sides
Color: Black & White (recommended for barcodes)
```

#### Browser Print Settings
```
1. Click Print Labels button
2. In print dialog:
   - Destination: Your printer
   - Pages: All
   - Layout: Portrait
   - Color: Black and white
   - More settings:
     - Paper size: A4
     - Margins: Default
     - Scale: 100%
     - Options: Background graphics ON
```

## Barcode Scanning Optimization

### Print Quality Requirements
- **Minimum DPI**: 203 DPI (barcode printers)
- **Recommended DPI**: 300+ DPI
- **Paper Quality**: Smooth, non-textured
- **Ink Quality**: Solid black, no fading

### Barcode Dimensions by Size
| Label Size | Barcode Width | Barcode Height | Scannable Distance |
|------------|---------------|----------------|-------------------|
| Extra Small | 0.8" | 0.2" | 2-4 inches |
| Small | 1.2" | 0.3" | 3-6 inches |
| Medium | 1.8" | 0.4" | 4-8 inches |
| Large | 2.4" | 0.5" | 6-12 inches |
| Extra Large | 3.2" | 0.6" | 8-15 inches |

## Troubleshooting Print Issues

### Labels Too Small/Large
- **Problem**: Labels don't match expected size
- **Solution**: Ensure 100% scale, no "fit to page"
- **Check**: Browser zoom should be 100%

### Barcodes Not Scanning
- **Problem**: Poor print quality
- **Solutions**:
  - Increase printer DPI to 300+
  - Use high-quality label stock
  - Clean printer heads
  - Check ink/toner levels

### Alignment Issues on A4
- **Problem**: Labels not aligned properly
- **Solutions**:
  - Use exact margins (0.5")
  - Print test page first
  - Adjust printer paper guides
  - Use label sheets with guidelines

### Cutting Problems (Barcode Printers)
- **Problem**: Labels cut in wrong place
- **Solutions**:
  - Calibrate printer sensors
  - Use correct label size settings
  - Clean label sensors
  - Check label stock compatibility

## Recommended Label Stock

### For Barcode Printers
- **Thermal Direct**: Zebra Z-Select 4000D
- **Thermal Transfer**: Zebra Z-Ultimate 3000T
- **Adhesive**: Permanent acrylic for most uses

### For A4 Printing
- **Laser Printers**: Avery 5160 compatible sheets
- **Inkjet Printers**: Waterproof polyester labels
- **Paper Weight**: 20lb minimum for durability

## Cost Optimization

### Labels per Roll/Sheet
| Size | Thermal Roll | A4 Sheet | Cost per Label |
|------|-------------|----------|----------------|
| Extra Small | 2,340 labels | 80 labels | $0.002 |
| Small | 1,500 labels | 35 labels | $0.003 |
| Medium | 1,000 labels | 24 labels | $0.005 |
| Large | 500 labels | 12 labels | $0.008 |
| Extra Large | 300 labels | 6 labels | $0.012 |

### Recommendations
- **High Volume**: Use thermal barcode printer with rolls
- **Low Volume**: Use A4 sheets with laser printer
- **Mixed Sizes**: Keep medium size as standard, others for special cases
- **Quality vs Cost**: Medium size offers best balance

## Quick Setup Checklist

### Before Printing
- [ ] Product has SKU assigned
- [ ] Barcode generates correctly (test scan)
- [ ] Printer calibrated and clean
- [ ] Correct label stock loaded
- [ ] Print settings configured (100% scale)

### After Printing
- [ ] Test scan first label
- [ ] Check label adhesion
- [ ] Verify text readability
- [ ] Store unused labels properly
- [ ] Document any adjustments needed

This system ensures professional-quality labels that scan reliably across all your inventory management needs!