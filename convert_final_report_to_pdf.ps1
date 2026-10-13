$wdFormatPDF = 17
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $docPath = "e:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup\Streetify_Final_Report_Guide.docx"
    $pdfPath = "e:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup\Streetify_Final_Report_Guide.pdf"
    
    if (Test-Path $pdfPath) {
        Remove-Item $pdfPath -Force
    }
    
    $doc = $word.Documents.Open($docPath)
    $doc.SaveAs([ref]$pdfPath, [ref]$wdFormatPDF)
    $doc.Close()
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    Write-Output "SUCCESS: PDF generated: Streetify_Final_Report_Guide.pdf"
} catch {
    Write-Output "Word COM error: $_"
}
