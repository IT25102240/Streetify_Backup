$wdFormatPDF = 17
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $docPath = "e:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup\Batch1_2026-Y2-S1-KU-24_Testcases.docx"
    $pdfPath = "e:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup\Batch1_2026-Y2-S1-KU-24_Testcases.pdf"
    $doc = $word.Documents.Open($docPath)
    $doc.SaveAs([ref]$pdfPath, [ref]$wdFormatPDF)
    $doc.Close()
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    Write-Output "SUCCESS: PDF generated: Batch1_2026-Y2-S1-KU-24_Testcases.pdf"
} catch {
    Write-Output "Word COM error: $_"
}
