export function translate(key, lang) {
  let translations = {
    en: {
      wrongPassword:
        "Could not log you in, are your username and password correct?",
      wrongUri:
        "Cannot connect to nextcloud server. Please check configured URI: ",
      loginText:
        "Please log in to give this app access to your Nextcloud Account.",
    },
    de: {
      wrongPassword:
        "Der Login war nicht möglich. Bitte Benutzername und Passwort prüfen.",
      wrongUri:
        "Verbindung mit dem Nextcloud Server nicht möglich. Bitte die konfigurierte URI prüfen: ",
      loginText:
        "Bitte einloggen, um Zugang zum Nextcloud Account zu ermöglichen.",
    },
  };

    if (!(lang in translations)){
      lang = "en";
  }
  if (!key in translations[lang]){
      return "translation error";
  }
  return translations[lang][key];
}
