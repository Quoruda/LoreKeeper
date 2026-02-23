use std::fs;
use std::path::Path;

#[tauri::command]
pub fn init_project(path: String) -> Result<String, String> {
    let project_path = Path::new(&path);
    
    // S'assurer que le chemin est bien un dossier
    if !project_path.is_dir() {
        return Err("Le chemin spécifié n'est pas un dossier valide.".into());
    }

    let dirs_to_create = ["chapters", "characters", "lore"];

    for dir in dirs_to_create.iter() {
        let full_path = project_path.join(dir);
        if !full_path.exists() {
            if let Err(e) = fs::create_dir(&full_path) {
                return Err(format!("Impossible de créer le dossier {} : {}", dir, e));
            }
        }
    }

    Ok("Projet initialisé avec succès.".into())
}

#[tauri::command]
pub fn list_files(path: String) -> Result<Vec<String>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err("Le chemin spécifié n'est pas un dossier valide.".into());
    }

    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_file() {
                    if let Some(file_name) = entry.file_name().to_str() {
                        files.push(file_name.to_string());
                    }
                }
            }
        }
    }
    
    // Trier par ordre alphabétique
    files.sort();
    Ok(files)
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Erreur lors de la lecture du fichier : {}", e)),
    }
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    match fs::write(&path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Erreur lors de l'écriture du fichier : {}", e)),
    }
}

#[tauri::command]
pub fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    match fs::rename(&old_path, &new_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Erreur lors du renommage du fichier : {}", e)),
    }
}
