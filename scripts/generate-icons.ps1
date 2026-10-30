Add-Type -AssemblyName System.Drawing

function Draw-RoundedRectangle($graphics, $pen, $brush, $x, $y, $w, $h, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
    
    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc($x + $w - $diameter, $y, $diameter, $diameter, 270, 90)
    $path.AddArc($x + $w - $diameter, $y + $h - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($x, $y + $h - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    
    if ($brush -ne $null) {
        $graphics.FillPath($brush, $path)
    }
    if ($pen -ne $null) {
        $graphics.DrawPath($pen, $path)
    }
}

function Generate-GroceryIcon($targetSize, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Scale factor based on 512 base size
    $scale = $targetSize / 512.0
    
    # Background squircle
    $bgRect = New-Object System.Drawing.Rectangle(0, 0, $targetSize, $targetSize)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $bgRect,
        [System.Drawing.Color]::FromArgb(255, 37, 99, 235), # #2563eb
        [System.Drawing.Color]::FromArgb(255, 29, 78, 216), # #1d4ed8
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    Draw-RoundedRectangle $g $null $bgBrush 0 0 $targetSize $targetSize (108 * $scale)
    
    # Subtle Inner Highlight Border
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), (3 * $scale))
    Draw-RoundedRectangle $g $borderPen $null (8 * $scale) (8 * $scale) ($targetSize - 16 * $scale) ($targetSize - 16 * $scale) (100 * $scale)
    
    # --- GROCERIES PEAKING OUT ---
    # 1. Bread Loaf (Left)
    $breadBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 234, 179, 8))
    Draw-RoundedRectangle $g $null $breadBrush (140 * $scale) (125 * $scale) (65 * $scale) (110 * $scale) (28 * $scale)
    $breadLinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 202, 138, 4), (4 * $scale))
    $breadLinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $breadLinePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($breadLinePen, (155 * $scale), (150 * $scale), (185 * $scale), (160 * $scale))
    $g.DrawLine($breadLinePen, (155 * $scale), (175 * $scale), (185 * $scale), (185 * $scale))

    # 2. Milk Bottle (Center)
    $milkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    Draw-RoundedRectangle $g $null $milkBrush (225 * $scale) (105 * $scale) (62 * $scale) (130 * $scale) (14 * $scale)
    # Milk Cap
    $capBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    Draw-RoundedRectangle $g $null $capBrush (238 * $scale) (90 * $scale) (36 * $scale) (20 * $scale) (6 * $scale)
    # Milk Label
    $labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 224, 242, 254))
    Draw-RoundedRectangle $g $null $labelBrush (231 * $scale) (145 * $scale) (50 * $scale) (42 * $scale) (6 * $scale)
    $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 2, 132, 199))
    $g.FillEllipse($badgeBrush, (246 * $scale), (156 * $scale), (20 * $scale), (20 * $scale))

    # 3. Carrot (Right)
    $carrotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
    $p1 = New-Object System.Drawing.PointF([float](295 * $scale), [float](140 * $scale))
    $p2 = New-Object System.Drawing.PointF([float](375 * $scale), [float](220 * $scale))
    $p3 = New-Object System.Drawing.PointF([float](360 * $scale), [float](230 * $scale))
    [System.Drawing.PointF[]]$carrotPoints = @($p1, $p2, $p3)
    $g.FillPolygon($carrotBrush, $carrotPoints)
    # Carrot Greens
    $greenPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 34, 197, 94), (4 * $scale))
    $greenPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $greenPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($greenPen, (290 * $scale), (135 * $scale), (280 * $scale), (120 * $scale))
    $g.DrawLine($greenPen, (295 * $scale), (137 * $scale), (308 * $scale), (120 * $scale))

    # 4. Red Apple (Front Right)
    $appleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
    $g.FillEllipse($appleBrush, (300 * $scale), (145 * $scale), (80 * $scale), (80 * $scale))
    # Apple Leaf & Stem
    $stemPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 120, 53, 15), (5 * $scale))
    $stemPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $stemPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($stemPen, (340 * $scale), (144 * $scale), (348 * $scale), (125 * $scale))
    $leafBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
    $g.FillEllipse($leafBrush, (345 * $scale), (125 * $scale), (22 * $scale), (14 * $scale))

    # --- SHOPPING CART ---
    # Basket Body (Trapezoid with rounded corners)
    $basketBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
    $basketPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $basketPath.AddLine((120 * $scale), (205 * $scale), (375 * $scale), (205 * $scale))
    $basketPath.AddLine((375 * $scale), (205 * $scale), (355 * $scale), (340 * $scale))
    $basketPath.AddLine((355 * $scale), (340 * $scale), (155 * $scale), (340 * $scale))
    $basketPath.CloseFigure()
    $g.FillPath($basketBrush, $basketPath)

    # Cart Metal Slats
    $slatPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 203, 213, 225), (5 * $scale))
    $slatPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $slatPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($slatPen, (165 * $scale), (225 * $scale), (175 * $scale), (325 * $scale))
    $g.DrawLine($slatPen, (212 * $scale), (225 * $scale), (218 * $scale), (325 * $scale))
    $g.DrawLine($slatPen, (260 * $scale), (225 * $scale), (260 * $scale), (325 * $scale))
    $g.DrawLine($slatPen, (308 * $scale), (225 * $scale), (302 * $scale), (325 * $scale))
    $g.DrawLine($slatPen, (350 * $scale), (225 * $scale), (340 * $scale), (325 * $scale))

    # Cart Horizontal Trim
    $trimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 148, 163, 184), (5 * $scale))
    $g.DrawLine($trimPen, (140 * $scale), (275 * $scale), (362 * $scale), (275 * $scale))

    # Cart Rim Top Bar
    $rimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), (12 * $scale))
    $rimPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $rimPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($rimPen, (115 * $scale), (205 * $scale), (385 * $scale), (205 * $scale))

    # Cart Handle & Chassis Frame
    $chassisPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 226, 232, 240), (12 * $scale))
    $chassisPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $chassisPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($chassisPen, (98 * $scale), (165 * $scale), (124 * $scale), (205 * $scale))
    $g.DrawLine($chassisPen, (124 * $scale), (205 * $scale), (155 * $scale), (355 * $scale))
    $g.DrawLine($chassisPen, (155 * $scale), (355 * $scale), (345 * $scale), (355 * $scale))

    # Golden Handle Grip
    $handlePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 245, 158, 11), (14 * $scale))
    $handlePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $handlePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($handlePen, (88 * $scale), (155 * $scale), (105 * $scale), (175 * $scale))

    # Wheel Legs
    $legPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 203, 213, 225), (10 * $scale))
    $g.DrawLine($legPen, (175 * $scale), (355 * $scale), (185 * $scale), (395 * $scale))
    $g.DrawLine($legPen, (325 * $scale), (355 * $scale), (315 * $scale), (395 * $scale))

    # Wheels
    $wheelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $hubBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillEllipse($wheelBrush, (163 * $scale), (385 * $scale), (44 * $scale), (44 * $scale))
    $g.FillEllipse($hubBrush, (175 * $scale), (397 * $scale), (20 * $scale), (20 * $scale))

    $g.FillEllipse($wheelBrush, (293 * $scale), (385 * $scale), (44 * $scale), (44 * $scale))
    $g.FillEllipse($hubBrush, (305 * $scale), (397 * $scale), (20 * $scale), (20 * $scale))

    # Save PNG
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($targetSize x $targetSize)"
}

$iconsDir = "c:\wamp64\www\leonie\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force
}

Generate-GroceryIcon 512 "$iconsDir\icon-512.png"
Generate-GroceryIcon 512 "$iconsDir\icon-512-maskable.png"
Generate-GroceryIcon 192 "$iconsDir\icon-192.png"
Generate-GroceryIcon 180 "$iconsDir\apple-touch-icon.png"
Generate-GroceryIcon 32  "$iconsDir\favicon-32x32.png"
Generate-GroceryIcon 16  "$iconsDir\favicon-16x16.png"
