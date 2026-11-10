Add-Type -AssemblyName System.Drawing

function Generate-Icon {
    param(
        [int]$size,
        [string]$outputPath,
        [bool]$isMaskable = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $scale = $size / 512.0

    # 1. Background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 11, 17, 32), # Deep Navy
        [System.Drawing.Color]::FromArgb(255, 15, 23, 42), # Slate 900
        45.0
    )
    $g.FillRectangle($bgBrush, $rect)

    # Subtle inner glow
    $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowRect = New-Object System.Drawing.Rectangle(
        [int](96 * $scale),
        [int](96 * $scale),
        [int](320 * $scale),
        [int](320 * $scale)
    )
    $glowPath.AddEllipse($glowRect)
    $pgb = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
    $pgb.CenterColor = [System.Drawing.Color]::FromArgb(60, 16, 185, 129) # Emerald glow
    $pgb.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 11, 17, 32))
    $g.FillPath($pgb, $glowPath)

    # 2. Outer decorative ring
    $ringPen = New-Object System.Drawing.Pen(
        [System.Drawing.Color]::FromArgb(50, 59, 130, 246),
        [float](3 * $scale)
    )
    $ringRect = New-Object System.Drawing.Rectangle(
        [int](64 * $scale),
        [int](64 * $scale),
        [int](384 * $scale),
        [int](384 * $scale)
    )
    $g.DrawEllipse($ringPen, $ringRect)

    # 3. Dynamic ascending bars
    # Bar 1
    $b1Brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle([int](140 * $scale), [int](270 * $scale), [int](44 * $scale), [int](100 * $scale))),
        [System.Drawing.Color]::FromArgb(220, 59, 130, 246),
        [System.Drawing.Color]::FromArgb(220, 37, 99, 235),
        90.0
    )
    $g.FillRectangle($b1Brush, [float](140 * $scale), [float](270 * $scale), [float](44 * $scale), [float](100 * $scale))

    # Bar 2
    $b2Brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle([int](204 * $scale), [int](220 * $scale), [int](44 * $scale), [int](150 * $scale))),
        [System.Drawing.Color]::FromArgb(240, 14, 165, 233),
        [System.Drawing.Color]::FromArgb(240, 2, 132, 199),
        90.0
    )
    $g.FillRectangle($b2Brush, [float](204 * $scale), [float](220 * $scale), [float](44 * $scale), [float](150 * $scale))

    # Bar 3
    $b3Brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle([int](268 * $scale), [int](170 * $scale), [int](44 * $scale), [int](200 * $scale))),
        [System.Drawing.Color]::FromArgb(250, 16, 185, 129),
        [System.Drawing.Color]::FromArgb(250, 5, 150, 105),
        90.0
    )
    $g.FillRectangle($b3Brush, [float](268 * $scale), [float](170 * $scale), [float](44 * $scale), [float](200 * $scale))

    # Bar 4
    $b4Brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle([int](332 * $scale), [int](120 * $scale), [int](44 * $scale), [int](250 * $scale))),
        [System.Drawing.Color]::FromArgb(255, 52, 211, 153),
        [System.Drawing.Color]::FromArgb(255, 16, 185, 129),
        90.0
    )
    $g.FillRectangle($b4Brush, [float](332 * $scale), [float](120 * $scale), [float](44 * $scale), [float](250 * $scale))

    # Base line
    $basePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 148, 163, 184), [float](3 * $scale))
    $g.DrawLine($basePen, [float](120 * $scale), [float](372 * $scale), [float](395 * $scale), [float](372 * $scale))

    # 4. Trendline
    $trendPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), [float](8 * $scale))
    $trendPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $trendPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $p1 = New-Object System.Drawing.PointF([float](130 * $scale), [float](310 * $scale))
    $p2 = New-Object System.Drawing.PointF([float](195 * $scale), [float](255 * $scale))
    $p3 = New-Object System.Drawing.PointF([float](260 * $scale), [float](240 * $scale))
    $p4 = New-Object System.Drawing.PointF([float](325 * $scale), [float](145 * $scale))
    $p5 = New-Object System.Drawing.PointF([float](385 * $scale), [float](110 * $scale))

    $g.DrawCurve($trendPen, @($p1, $p2, $p3, $p4, $p5), 0.5)

    # 5. Glowing Peak Node
    $nodeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
    $nodeOutline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), [float](4 * $scale))
    $nodeRect = New-Object System.Drawing.RectangleF([float](373 * $scale), [float](98 * $scale), [float](24 * $scale), [float](24 * $scale))
    $g.FillEllipse($nodeBrush, $nodeRect)
    $g.DrawEllipse($nodeOutline, $nodeRect)

    # 6. Currency/Growth Badge at bottom
    $badgeRect = New-Object System.Drawing.RectangleF([float](146 * $scale), [float](400 * $scale), [float](220 * $scale), [float](44 * $scale))
    $badgePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = [float](16 * $scale)
    $badgePath.AddArc($badgeRect.X, $badgeRect.Y, $radius, $radius, 180, 90)
    $badgePath.AddArc($badgeRect.Right - $radius, $badgeRect.Y, $radius, $radius, 270, 90)
    $badgePath.AddArc($badgeRect.Right - $radius, $badgeRect.Bottom - $radius, $radius, $radius, 0, 90)
    $badgePath.AddArc($badgeRect.X, $badgeRect.Bottom - $radius, $radius, $radius, 90, 90)
    $badgePath.CloseFigure()

    $badgeBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $badgeRect,
        [System.Drawing.Color]::FromArgb(240, 16, 185, 129),
        [System.Drawing.Color]::FromArgb(240, 5, 150, 105),
        0.0
    )
    $g.FillPath($badgeBrush, $badgePath)

    # Badge text
    $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    $fontSize = [float](20 * $scale)
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("PORTFOLIO", $font, $textBrush, $badgeRect, $sf)

    # Save PNG
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $font.Dispose()
    $textBrush.Dispose()
    $badgeBrush.Dispose()
    $badgePath.Dispose()
    $nodeOutline.Dispose()
    $nodeBrush.Dispose()
    $trendPen.Dispose()
    $basePen.Dispose()
    $b4Brush.Dispose()
    $b3Brush.Dispose()
    $b2Brush.Dispose()
    $b1Brush.Dispose()
    $ringPen.Dispose()
    $pgb.Dispose()
    $glowPath.Dispose()
    $bgBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated: $outputPath ($size x $size)"
}

# Generate all target icons
Generate-Icon -size 512 -outputPath "public\icon-512.png"
Generate-Icon -size 192 -outputPath "public\icon-192.png"
Generate-Icon -size 512 -outputPath "public\icon-maskable-512.png" -isMaskable $true
Generate-Icon -size 192 -outputPath "public\icon-maskable-192.png" -isMaskable $true
Generate-Icon -size 180 -outputPath "public\apple-touch-icon.png"
Generate-Icon -size 64  -outputPath "public\favicon-64.png"
Generate-Icon -size 32  -outputPath "public\favicon-32.png"
Generate-Icon -size 512 -outputPath "src\app\icon.png"
Generate-Icon -size 180 -outputPath "src\app\apple-icon.png"
