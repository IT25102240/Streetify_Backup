$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = 'e:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup\Streetify_SE_Final_Report_DRAFT.docx'
$pdfPath = 'e:\2Y1S\2Y1S_Projects\SE_project\Streetify\Streetify_Backup\Streetify_SE_Final_Report_DRAFT.pdf'
$absDoc = [System.IO.Path]::GetFullPath($docPath)
$absPdf = [System.IO.Path]::GetFullPath($pdfPath)
$doc = $word.Documents.Open($absDoc)
$doc.SaveAs([ref]$absPdf, [ref]17)
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "PDF saved to: $absPdf"
