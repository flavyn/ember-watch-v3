Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public class ShotLuma {
  public static double Mean(string path) {
    using (var image = new Bitmap(path)) {
      var rect = new Rectangle(0, 0, image.Width, image.Height);
      var bits = image.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
      try {
        var data = new byte[Math.Abs(bits.Stride) * image.Height];
        Marshal.Copy(bits.Scan0, data, 0, data.Length);
        double sum = 0;
        for(int y=0;y<image.Height;y++) for(int x=0;x<image.Width;x++) {
          int i=y*Math.Abs(bits.Stride)+x*3;
          sum += .2126*data[i+2] + .7152*data[i+1] + .0722*data[i];
        }
        return sum / (image.Width * image.Height);
      } finally { image.UnlockBits(bits); }
    }
  }
}
'@
Get-ChildItem (Join-Path $PSScriptRoot '../screenshots/*.jpg') | ForEach-Object {
  $bitmap = [System.Drawing.Bitmap]::new($_.FullName)
  $luma = [ShotLuma]::Mean($_.FullName)
  $valid = $bitmap.Width -eq 1280 -and $bitmap.Height -eq 720 -and $_.Length -lt 262144 -and $luma -ge 45
  [pscustomobject]@{File=$_.Name;Width=$bitmap.Width;Height=$bitmap.Height;Bytes=$_.Length;Luma=[Math]::Round($luma,2);Pass=$valid}
  $bitmap.Dispose()
  if (!$valid) { throw "Screenshot constraints failed: $($_.Name)" }
}
