using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/storage")]
public class StorageController(IWebHostEnvironment env) : ControllerBase
{
  private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
  private const long MaxBytes = 10 * 1024 * 1024;

  [HttpPost("upload")]
  [RequestSizeLimit(MaxBytes)]
  public async Task<ActionResult<object>> Upload(IFormFile file, CancellationToken cancellationToken)
  {
    if (file.Length == 0 || file.Length > MaxBytes)
      return BadRequest(new { error = "Invalid file size." });

    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!AllowedExtensions.Contains(ext))
      return BadRequest(new { error = "Only images and PDF are allowed." });

    var uploadsDir = Path.Combine(env.ContentRootPath, "uploads");
    Directory.CreateDirectory(uploadsDir);

    var fileName = $"{Guid.NewGuid():N}{ext}";
    var fullPath = Path.Combine(uploadsDir, fileName);

    await using var stream = System.IO.File.Create(fullPath);
    await file.CopyToAsync(stream, cancellationToken);

    return Ok(new { path = $"/uploads/{fileName}", fileName });
  }

  [HttpGet("files/{fileName}")]
  [AllowAnonymous]
  public IActionResult GetFile(string fileName)
  {
    if (fileName.Contains("..") || fileName.Contains('/') || fileName.Contains('\\'))
      return BadRequest();

    var fullPath = Path.Combine(env.ContentRootPath, "uploads", fileName);
    if (!System.IO.File.Exists(fullPath))
      return NotFound();

    var contentType = Path.GetExtension(fileName).ToLowerInvariant() switch
    {
      ".pdf" => "application/pdf",
      ".png" => "image/png",
      ".webp" => "image/webp",
      _ => "image/jpeg"
    };

    return PhysicalFile(fullPath, contentType);
  }
}
