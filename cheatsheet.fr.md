# Aide-mémoire des commandes Linux / Unix (examen de Systèmes d'exploitation)

7 nov. 2026 · @akrem

Toutes les commandes de vos 5 documents de cours (TP1 Bases d'Unix, Interpréteur de commandes, TP4 Fichiers, TP5 Processus, Mémoire cache), regroupées par fonction, avec leur nom complet et une explication d'une ligne.

## 0. Conventions, outils et répertoires

### Notation utilisée dans cet aide-mémoire

| Symbole                        | Signification                                                                           | ;   |
| ------------------------------ | --------------------------------------------------------------------------------------- | --- |
| `$`                            | Invite du shell (utilisateur normal). Ne pas la taper.                                  |
| `#`                            | Commentaire dans un script (mais `#!` en ligne 1 = shebang).                            |
| `[ ... ]`                      | Argument facultatif                                                                     |
| `-x`, `--long`                 | Option courte / option longue                                                           |
| `~`                            | Votre répertoire personnel (`$HOME`)                                                    |
| `.` / `..`                     | Répertoire courant / répertoire parent                                                  |
| `/`                            | Racine du système de fichiers ; aussi le séparateur de chemin                           |
| `-`                            | Avec `cd -` : répertoire précédent                                                      |
| `*` `?` `[a-z]`                | Jokers (globbing) : n'importe quelle chaîne / un caractère / un caractère d'un ensemble |
| `$VAR`, `${VAR}`               | Valeur d'une variable                                                                   |
| `$(cmd)`                       | Sortie d'une commande (substitution de commande)                                        |
| `$$`                           | PID du shell courant                                                                    |
| `$?`                           | Code de retour de la dernière commande (0 = succès)                                     |
| `Ctrl-c` / `Ctrl-z` / `Ctrl-d` | Interrompre (SIGINT) / suspendre (SIGTSTP) / fin d'entrée (EOF) ou déconnexion          |
| `Ctrl-r`                       | Recherche inversée dans l'historique des commandes                                      |

### Sections du manuel (`man N cmd`)

| N   | Contenu                             | Exemple                       |
| --- | ----------------------------------- | ----------------------------- |
| 1   | Commandes utilisateur               | `man 1 mkdir` (la commande)   |
| 2   | Appels système                      | `man 2 mkdir` (la fonction C) |
| 3   | Fonctions de la bibliothèque C      | `man 3 printf`                |
| 5   | Formats de fichiers / configuration | `man 5 passwd`                |
| 7   | Divers (regex, signaux...)          | `man 7 regex`                 |

### Outils et shells

| Outil   | Nom complet                | Rôle                                                                                                                |
| ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `bash`  | Bourne Again SHell         | Interpréteur de commandes par défaut sous Linux (shell Bourne `sh` amélioré). Exécute les commandes et les scripts. |
| `man`   | manual                     | Pages du manuel de référence                                                                                        |
| `info`  | GNU info                   | Documentation plus longue que man (nécessaire pour `sed`)                                                           |
| `htop`  | interactive process viewer | `top` amélioré et en couleurs                                                                                       |
| `ssh`   | Secure SHell               | Connexion à distance sécurisée                                                                                      |
| `gcc`   | GNU C Compiler             | Compile les programmes C du TP5                                                                                     |
| `xeyes` | X eyes                     | Petit programme graphique (X11) utilisé pour tester les processus et `ssh -X`                                       |

### Répertoires importants

| Répertoire            | Contenu                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| `/`                   | Racine de toute l'arborescence                                                          |
| `/home/login` (= `~`) | Fichiers personnels ; les mêmes sur toutes les machines du réseau de l'école            |
| `/tmp`                | Fichiers temporaires ; propres à chaque machine                                         |
| `/etc`                | Configuration du système (`/etc/hosts`, `/etc/hostname`, `/etc/passwd`, `/etc/profile`) |
| `/bin`, `/usr/bin`    | Commandes standard (exécutables)                                                        |
| `$HOME/bin`           | Vos scripts personnels (ajouté au début du `PATH`)                                      |
| `/dev`                | Périphériques vus comme des fichiers (`/dev/null`, terminaux comme `/dev/pts/0`)        |
| `/opt`                | Logiciels optionnels (l'ISO Ubuntu du TP5 est dans `/opt/iso`)                          |
| `/proc`               | Fichiers virtuels décrivant les processus en cours                                      |

### Fichiers de configuration de bash

| Fichier                                          | Quand il s'exécute                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/etc/profile`                                   | Shell de connexion, pour tous les utilisateurs                                                                             |
| `~/.bash_profile`, `~/.bash_login`, `~/.profile` | Shell de connexion, par utilisateur (le premier trouvé)                                                                    |
| `~/.bashrc`                                      | Shells hors connexion (chaque nouveau terminal). Mettez-y les alias, `export`, `PATH` et `PS1` pour les rendre permanents. |
| `~/.bash_logout`                                 | À la déconnexion                                                                                                           |

### Variables d'environnement importantes

| Variable         | Signification                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `PATH`           | Liste de répertoires, séparés par des deux-points, dans lesquels les commandes sont cherchées |
| `HOME`           | Répertoire personnel                                                                          |
| `USER`           | Nom de connexion (login)                                                                      |
| `PS1`            | Format de l'invite                                                                            |
| `SHELL`          | Chemin du shell de connexion                                                                  |
| `PWD` / `OLDPWD` | Répertoire courant / précédent                                                                |

### Types de fichiers (premier caractère de `ls -l`)

| Car.      | Type                          |
| --------- | ----------------------------- |
| `-`       | Fichier ordinaire             |
| `d`       | Répertoire                    |
| `l`       | Lien symbolique               |
| `c` / `b` | Périphérique caractère / bloc |
| `p`       | Tube (tube nommé, FIFO)       |
| `s`       | Socket                        |

### Flux standard (descripteurs de fichiers)

| Numéro | Nom                               | Par défaut |
| ------ | --------------------------------- | ---------- |
| 0      | stdin (entrée standard)           | Clavier    |
| 1      | stdout (sortie standard)          | Écran      |
| 2      | stderr (sortie d'erreur standard) | Écran      |

## 1. Aide et documentation

| Commande       | Nom complet            | Ce qu'elle fait                                                                                                                                                    |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `man cmd`      | manual                 | Affiche la page de manuel d'une commande. Premier réflexe : RTFM (« Read The F... Manual »). Navigation avec les flèches, `/word` pour chercher, `q` pour quitter. |
| `man N cmd`    | manual, section N      | Choisit la section : `man 1 mkdir` = commande shell, `man 2 mkdir` = appel système.                                                                                |
| `man -k word`  | manual, keyword        | Cherche un mot-clé dans les noms et descriptions des pages de manuel. Identique à `apropos word`.                                                                  |
| `apropos word` | apropos (« à propos ») | Équivalent de `man -k` : liste les manuels liés à un mot-clé.                                                                                                      |
| `info cmd`     | GNU info               | Documentation hypertexte plus longue (nécessaire pour `sed`). Touches : `n` suivant, `p` précédent, `u` niveau supérieur, Entrée suit un lien, `q` quitte.         |
| `history`      | command history        | Liste les commandes que vous avez tapées (voir la section 8 pour `!!`, `!n`).                                                                                      |

## 2. Navigation et répertoires

| Commande         | Nom complet                             | Ce qu'elle fait                                                                                                         |
| ---------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pwd`            | print working directory                 | Affiche le chemin absolu du répertoire courant.                                                                         |
| `cd dir`         | change directory                        | Se déplace dans `dir`.                                                                                                  |
| `cd` ou `cd ~`   | change directory (répertoire personnel) | Revient dans votre répertoire personnel.                                                                                |
| `cd -`           | change directory (précédent)            | Retourne au répertoire précédent (bascule entre deux).                                                                  |
| `cd ..`          | change directory (parent)               | Remonte d'un niveau (`..` = parent).                                                                                    |
| `cd .`           | change directory (courant)              | Reste ici (`.` = répertoire courant).                                                                                   |
| `ls`             | list                                    | Liste le contenu d'un répertoire.                                                                                       |
| `ls -l`          | list, long format                       | Droits, liens, propriétaire, groupe, taille, date, nom.                                                                 |
| `ls -a`          | list, all                               | Inclut les fichiers cachés (noms commençant par `.`).                                                                   |
| `ls -al`         | list, all, long                         | Format long avec les fichiers cachés (montre : type, droits, nombre de liens, propriétaire, groupe, taille, date, nom). |
| `ls -i`          | list, inode                             | Affiche le numéro d'i-node de chaque fichier.                                                                           |
| `ls -R`          | list, recursive                         | Liste les sous-répertoires récursivement (`ls -lR /` = toute l'arborescence).                                           |
| `mkdir dir`      | make directory                          | Crée un répertoire.                                                                                                     |
| `mkdir -p a/b/c` | make directory, parents                 | Crée tout le chemin en une seule commande (ex. `~/TestASI/SE/TP/Num2`).                                                 |
| `mkdir d1 d2 d3` | make directory                          | Crée plusieurs répertoires au même niveau d'un coup.                                                                    |
| `rmdir dir`      | remove directory                        | Supprime un répertoire **vide** uniquement.                                                                             |
| `rmdir -p a/b/c` | remove directory, parents               | Supprime `a/b/c`, puis `a/b`, puis `a` si chacun devient vide.                                                          |

## 3. Fichiers : créer, copier, déplacer, supprimer, afficher, liens, inspecter

| Commande                           | Nom complet                   | Ce qu'elle fait                                                                                                  |
| ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `touch file`                       | touch                         | Crée un fichier vide (ou met à jour son horodatage).                                                             |
| `cat file`                         | concatenate                   | Affiche le contenu d'un fichier ; concatène plusieurs fichiers.                                                  |
| `cat > file`                       | concatenate (vers un fichier) | Crée un fichier à partir du clavier ; terminer avec `Ctrl-d`.                                                    |
| `less file`                        | less (l'opposé de « more »)   | Visualiseur paginé : flèches/espace pour se déplacer, `/word` pour chercher, `q` pour quitter.                   |
| `cp src dest`                      | copy                          | Copie un fichier. Si `dest` est un répertoire, garde le nom. `cp /etc/hosts .` copie dans le répertoire courant. |
| `cp src newname`                   | copy                          | Copie et renomme au passage (`cp /etc/hosts hostsBis`).                                                          |
| `cp -r dir1 dir2`                  | copy, recursive               | Copie un répertoire entier (ex. `cp -r ~/TPSE1 /tmp/`).                                                          |
| `mv src dest`                      | move                          | Déplace un fichier ou un répertoire ; sert aussi à **renommer** (`mv hostsBis hosts2`).                          |
| `rm file`                          | remove                        | Supprime un fichier (pas de corbeille !).                                                                        |
| `rm -r dir`                        | remove, recursive             | Supprime un répertoire et tout son contenu.                                                                      |
| `rm -rf dir`                       | remove, recursive, force      | Pareil, sans confirmation ni erreurs. Dangereux.                                                                 |
| `ln src link`                      | link                          | Crée un **lien physique** : un autre nom pour le même i-node (même fichier, même numéro d'i-node).               |
| `ln -s target link`                | link, symbolic                | Crée un **lien symbolique** (type `l`) : un petit fichier contenant un chemin. Il a son propre i-node.           |
| `file name`                        | file                          | Donne le type d'un fichier d'après son contenu (texte, exécutable ELF, ...).                                     |
| `stat file`                        | status                        | Informations détaillées : taille, i-node, nombre de liens, droits, propriétaire, dates.                          |
| `basename path [suffix]`           | base name                     | Enlève la partie répertoire (et le suffixe facultatif) : `basename /a/b/x.txt .txt` donne `x`.                   |
| `dirname path`                     | directory name                | Garde seulement la partie répertoire : `dirname /a/b/x.txt` donne `/a/b`.                                        |
| `find dir -name "*.txt"`           | find                          | Cherche dans une arborescence.                                                                                   |
| `find dir -name "*.c" -size +500c` | find                          | Filtre par nom et par taille (`c` = octets, `k` = Ko, `M` = Mo ; `+` = plus grand que).                          |
| `find dir -type f` / `-type d`     | find, type                    | Seulement les fichiers / seulement les répertoires.                                                              |

**Lien physique ou lien symbolique**

|                                              | Lien physique (`ln`)         | Lien symbolique (`ln -s`) |
| -------------------------------------------- | ---------------------------- | ------------------------- |
| i-node                                       | Le même que l'original       | Son propre i-node         |
| Type dans `ls -l`                            | `-` (fichier ordinaire)      | `l`                       |
| Nombre de liens (nombre après les droits)    | Augmente                     | Inchangé                  |
| Entre systèmes de fichiers (ex. vers `/tmp`) | Impossible                   | Possible                  |
| Sur un répertoire                            | Interdit                     | Possible                  |
| Original supprimé                            | Données toujours accessibles | Lien cassé (pendant)      |

**Comportement des i-nodes (TP4)**

- `cp` crée un nouveau fichier, donc un **nouvel** i-node.
- `mv` dans le même système de fichiers garde le même i-node (seule l'entrée de répertoire change).
- `mv` vers un autre système de fichiers (ex. `/tmp`) = copie + suppression, donc l'i-node **change**.
- Le nombre après les droits dans `ls -l` est le nombre de liens physiques.

## 4. Droits d'accès, utilisateurs et groupes

| Commande         | Nom complet              | Ce qu'elle fait                                                                                                                                          |
| ---------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chmod 750 file` | change mode              | Fixe les droits en **octal** (r=4, w=2, x=1) : propriétaire `rwx`, groupe `r-x`, autres `---`. Seul le propriétaire peut le faire.                       |
| `chmod g+w file` | change mode (symbolique) | Ajoute l'écriture pour le groupe. Qui : `u` utilisateur/propriétaire, `g` groupe, `o` autres, `a` tous. Opérateur : `+` ajouter, `-` retirer, `=` fixer. |
| `chmod u+x file` | change mode              | Rend un fichier exécutable par son propriétaire (alias `exe`).                                                                                           |
| `chmod u-x file` | change mode              | Retire le droit d'exécution (alias `unexe`).                                                                                                             |
| `chmod u-w file` | change mode              | Le propriétaire ne peut plus modifier le fichier (alias `protect`) ; `u+w` = `unprotect`.                                                                |
| `groups [user]`  | groups                   | Liste les groupes auxquels appartient un utilisateur.                                                                                                    |
| `id`             | identity                 | Affiche l'UID, le GID et les groupes de l'utilisateur courant.                                                                                           |
| `whoami`         | who am I                 | Affiche votre nom de connexion.                                                                                                                          |

**Lire `ls -l` :** `-rwxr-x--- 1 login group 1024 Nov 7 12:00 file`

| Champ             | Signification                                             |
| ----------------- | --------------------------------------------------------- |
| `-`               | Type de fichier (voir la section 0)                       |
| `rwx` `r-x` `---` | Droits du propriétaire (u), du groupe (g), des autres (o) |
| `1`               | Nombre de liens physiques                                 |
| `login` / `group` | Propriétaire / groupe propriétaire                        |
| `1024`            | Taille en octets                                          |
| date, nom         | Dernière modification, nom du fichier                     |

**Droits :** `r` lecture (4), `w` écriture (2), `x` exécution (1). Sur un **répertoire**, `x` signifie le droit d'y entrer (`cd`, accès à ses fichiers).

| Octal | Symbolique | Octal | Symbolique |
| ----- | ---------- | ----- | ---------- |
| 7     | `rwx`      | 3     | `-wx`      |
| 6     | `rw-`      | 2     | `-w-`      |
| 5     | `r-x`      | 1     | `--x`      |
| 4     | `r--`      | 0     | `---`      |

## 5. Disque, système et informations sur les utilisateurs

| Commande           | Nom complet | Ce qu'elle fait                                                                                      |
| ------------------ | ----------- | ---------------------------------------------------------------------------------------------------- |
| `du`               | disk usage  | Espace utilisé par des fichiers/répertoires. `du -sh dir` = total de `dir`, lisible par un humain.   |
| `df`               | disk free   | Espace libre/utilisé de chaque système de fichiers monté. `df -h` = lisible par un humain (K, M, G). |
| `quota`            | quota       | Affiche votre quota disque (espace autorisé) et l'utilisation actuelle.                              |
| `hostname`         | host name   | Affiche le nom de la machine.                                                                        |
| `who`              | who         | Liste les utilisateurs actuellement connectés (avec le terminal et l'heure de connexion).            |
| `whoami`           | who am I    | Votre nom de connexion.                                                                              |
| `id`               | identity    | UID, GID, groupes.                                                                                   |
| `tty`              | teletype    | Affiche le fichier périphérique du terminal courant (ex. `/dev/pts/0`).                              |
| `getent passwd`    | get entries | Liste tous les comptes de la base du système (locale + réseau). Champs : voir ci-dessous.            |
| `exit` ou `Ctrl-d` | exit        | Termine le shell / la session ssh.                                                                   |

**Champs d'une ligne `passwd`** (séparés par `:`)

`login : password(x) : UID : GID : full name : home directory : login shell`

- Champs 1, 6, 7 = login, répertoire personnel, shell.
- Champs 3, 4 = UID (identifiant de l'utilisateur), GID (identifiant du groupe principal) — les mêmes que ceux donnés par `id`.

## 6. Redirections, tubes et filtres de texte

### Redirections et tubes

| Syntaxe              | Nom                                | Ce qu'elle fait                                                                                                   |
| -------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `cmd > file`         | redirection de stdout (écrasement) | Écrit la sortie dans `file` en **effaçant** le contenu précédent.                                                 |
| `cmd >> file`        | redirection de stdout (ajout)      | Ajoute la sortie à la **fin** de `file`.                                                                          |
| `cmd < file`         | redirection de stdin               | Lit l'entrée depuis `file`.                                                                                       |
| `cmd 2> file`        | redirection de stderr              | Envoie les messages d'erreur dans `file`.                                                                         |
| `cmd > /dev/null`    | périphérique nul                   | Jette la sortie.                                                                                                  |
| `cmd1 \| cmd2`       | pipe (tube)                        | La sortie de `cmd1` devient l'entrée de `cmd2`. Les deux processus s'exécutent en même temps.                     |
| `cat << EOF ... EOF` | here document (document en ligne)  | Fournit les lignes jusqu'à `EOF` comme entrée ; pratique pour les messages sur plusieurs lignes dans les scripts. |
| `sort f > f`         | **piège**                          | Vide `f` avant que sort ne le lise : fichier perdu. Utiliser `sort f > tmp && mv tmp f` ou `sort -o f f`.         |

### Filtres

| Commande           | Nom complet                     | Ce qu'elle fait                                                                                         |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `grep pat file`    | global regular expression print | Affiche les lignes qui correspondent au motif.                                                          |
| `grep -E "a\|b"`   | grep, extended regex            | Utilise les expressions régulières étendues (`\|`, `+`, `?`, `()`).                                     |
| `grep -v pat`      | grep, invert                    | Lignes qui ne correspondent **pas**.                                                                    |
| `grep -i pat`      | grep, ignore case               | Recherche insensible à la casse.                                                                        |
| `cut -d: -f1 file` | cut                             | Extrait une ou plusieurs colonnes : `-d` délimiteur, `-f` numéro(s) de champ (`-f1,6`).                 |
| `sort file`        | sort                            | Trie les lignes par ordre alphabétique. `-r` inverse, `-n` numérique, `-u` unique, `-t: -k3` par champ. |
| `head -n 7 file`   | head                            | Les 7 premières lignes (10 par défaut).                                                                 |
| `tail -n 7 file`   | tail                            | Les 7 dernières lignes (10 par défaut). `tail -f` suit un fichier qui grandit.                          |
| `wc`               | word count                      | Compte les lignes, les mots, les octets. `wc -l` = lignes seulement.                                    |
| `uniq`             | unique                          | Supprime les lignes identiques consécutives (à utiliser après `sort`).                                  |
| `sed`              | stream editor                   | Éditeur de lignes : ajouter, supprimer, substituer des lignes (détails ci-dessous).                     |

Exemple d'enchaînement : `getent passwd | cut -d: -f1 | grep u | sort | head -n 7`

### Expressions régulières (regex, `man 7 regex`)

| Symbole | Signification                                  | Exemple                      |
| ------- | ---------------------------------------------- | ---------------------------- |
| `.`     | N'importe quel caractère                       | `z.e` correspond à « zoe »   |
| `^`     | Début de ligne                                 | `^a` lignes commençant par a |
| `$`     | Fin de ligne                                   | `e$` lignes finissant par e  |
| `[abc]` | Un des caractères listés                       | `[ze]`                       |
| `[a-d]` | Un caractère dans un intervalle                | `^[a-d]l`                    |
| `[^l]`  | N'importe quel caractère **sauf** l (négation) | `a[^l]a`                     |
| `a\|b`  | a ou b (alternative)                           | `oz\|zo`                     |
| `*`     | Zéro ou plusieurs fois le précédent            | `ab*`                        |
| `+`     | Une ou plusieurs fois le précédent             | `ua+`                        |
| `?`     | Zéro ou une fois le précédent                  | `abl?`                       |
| `(...)` | Groupe                                         | `(al\|abl)`                  |
| `\`     | Échappe un caractère spécial                   | `\.`                         |

Réponses types : commence par a ou b → `^[ab]` ; contient u puis au moins un a → `ua+` ; « al » ou « abl » → `ab?l` ; a puis z dans cet ordre → `a.*z` ; pas de l suivi d'une voyelle → `grep -v "l[aeiou]"`.

### sed (stream editor) : `sed [options] 'script' file`

| Commande                                                 | Ce qu'elle fait                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `sed '/a/d' f`                                           | Supprime (**d**elete) les lignes contenant un « a »                                                          |
| `sed 's/:/#/g' f`                                        | **S**ubstitue `:` par `#` (`g` = toutes les occurrences de la ligne)                                         |
| `sed 's/^/<</' f`                                        | Ajoute `<<` au début de chaque ligne                                                                         |
| `sed -e 's/^/<</' -e 's/$/>>/' f`                        | Deux commandes (`-e`) : `<<` au début et `>>` à la fin                                                       |
| `sed -E 's/^[^:]*/XX/' f`                                | `-E` = regex étendue ; remplace le login (premier champ) par XX                                              |
| `sed -E 's/^([^:]*):([^:]*):(.*):([^:]*)$/\1:\2:\3:\4/'` | Les groupes `( )` sont capturés puis réutilisés avec `\1`, `\2` ... pour échanger ou réordonner les colonnes |
| `sed -i ...`                                             | Modifie le fichier **sur place**                                                                             |
| `sed -n '5p' f`                                          | Affiche seulement la ligne 5 (`-n` désactive l'affichage automatique)                                        |

## 7. Shell bash : environnement, historique, alias, scripts

### Environnement et variables

| Commande                      | Nom complet     | Ce qu'elle fait                                                                                                                          |
| ----------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `env`                         | environment     | Liste toutes les variables d'environnement.                                                                                              |
| `echo $VAR`                   | echo            | Affiche la valeur d'une variable.                                                                                                        |
| `VAR=value`                   | affectation     | Définit une variable (pas d'espace autour de `=`) ; **locale** à ce shell.                                                               |
| `export VAR=value`            | export          | Définit une variable et la transmet aux **processus fils**.                                                                              |
| `export PATH=$HOME/bin:$PATH` | export          | Ajoute `~/bin` au **début** du `PATH` (vos scripts personnels passent en priorité). Mettez-le dans `~/.bashrc` pour le rendre permanent. |
| `export PS1="(\u@\h) \w$ "`   | prompt string 1 | Change l'invite : `\u` utilisateur, `\h` machine, `\w` répertoire. Exemple avec des parenthèses autour de login@machine.                 |
| `source file` ou `. file`     | source          | Exécute un fichier dans le shell **courant** (ex. `source ~/.bashrc` pour recharger).                                                    |
| `alias name='cmd'`            | alias           | Raccourci pour une commande (`alias ll='ls -l'`). À mettre dans `~/.bashrc` pour le garder. `unalias name` le supprime.                  |

### Historique

| Syntaxe            | Ce qu'elle fait                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `history`          | Liste les commandes passées, numérotées                                                               |
| Flèches haut / bas | Parcourir les commandes précédentes                                                                   |
| `Ctrl-r` + texte   | Recherche inversée ; appuyer de nouveau pour des correspondances plus anciennes, Entrée pour exécuter |
| `!!`               | Relance la dernière commande                                                                          |
| `!mk`              | Relance la dernière commande commençant par « mk »                                                    |
| `!-2`              | Relance la commande située 2 positions en arrière                                                     |
| `!5`               | Relance la commande numéro 5 de `history`                                                             |

### Expansions (faites par le shell **avant** d'exécuter la commande)

| Syntaxe                 | Signification                                             |
| ----------------------- | --------------------------------------------------------- |
| `$VAR` / `${VAR}`       | Valeur de la variable                                     |
| `$((expr))`             | Arithmétique : `echo $((3+4))` donne 7                    |
| `$(cmd)` ou `` `cmd` `` | Sortie d'une commande : `echo $(date)`                    |
| `*`                     | N'importe quelle chaîne (tous les fichiers du répertoire) |
| `?`                     | Exactement un caractère                                   |
| `[a-z]`                 | Un caractère de l'intervalle                              |
| `{a,b,c}`               | Expansion des accolades (`mkdir d{1,2,3}`)                |
| `~`                     | Répertoire personnel                                      |

Guillemets : `"..."` garde l'expansion de `$` ; `'...'` prend tout au pied de la lettre ; `\` échappe un caractère.

### Bases des scripts

| Élément             | Syntaxe / usage                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Shebang             | `#!/bin/bash` sur la **première ligne** : désigne l'interpréteur.                                        |
| Rendre exécutable   | `chmod u+x script.sh`, puis lancer `./script.sh` (ou via le `PATH`). Sans `x` : `bash script.sh`.        |
| Pourquoi `./`       | Le répertoire courant n'est pas dans le `PATH` ; le shell ne cherche que dans les répertoires du `PATH`. |
| Sortie              | `echo text`                                                                                              |
| Lire une entrée     | `read var`                                                                                               |
| Code de retour      | `exit N` termine le script avec le code N ; `$?` contient le dernier code (0 = OK).                      |
| Here document       | `cat << EOF` ... `EOF` affiche un message sur plusieurs lignes (texte d'usage).                          |
| Générer des nombres | `seq 1 20` affiche de 1 à 20 (`for i in $(seq 1 20)`).                                                   |

### Variables spéciales

| Variable        | Signification                                                           |
| --------------- | ----------------------------------------------------------------------- |
| `$0`            | Nom du script                                                           |
| `$1`, `$2`, ... | Arguments 1, 2, ...                                                     |
| `$#`            | Nombre d'arguments                                                      |
| `$*`            | Tous les arguments en un seul mot (entre guillemets)                    |
| `$@`            | Tous les arguments, chacun gardé comme un mot séparé (entre guillemets) |
| `$?`            | Code de retour de la dernière commande                                  |
| `$$`            | PID du shell/script                                                     |
| `$!`            | PID du dernier processus lancé en arrière-plan                          |

### Structures de contrôle

```bash
# if / elif / else  ([[ ... ]] est une évolution de test et de [ ... ])
if [[ $# -lt 2 ]]; then
    echo "usage: $0 a b"
elif [[ $(( $1 % 2 )) -eq 0 ]]; then
    echo even
else
    echo odd
fi

# boucle for
for f in $(ls dir); do echo "$f"; done
for i in $(seq 1 5); do echo $i; done

# comparaison avec une regex (vérifier un nombre)
[[ $2 =~ ^[0-9]+$ ]] || echo "not a number"

# renommer : remplacer pattern1 par pattern2 dans un nom de fichier
new=$(echo "$f" | sed "s/$p1/$p2/")
mv "$f" "$new"
```

| Test                                         | Vrai quand                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `-f x` / `-d x` / `-e x`                     | x est un fichier ordinaire / un répertoire / existe                                   |
| `-r x` / `-w x` / `-x x`                     | x est lisible / modifiable / exécutable                                               |
| `-z s` / `-n s`                              | la chaîne est vide / non vide                                                         |
| `a -eq b`, `-ne`, `-lt`, `-le`, `-gt`, `-ge` | entiers égaux, différents, inférieur, inférieur ou égal, supérieur, supérieur ou égal |
| `s1 == s2`, `s1 != s2`                       | chaînes égales / différentes                                                          |
| `s =~ regex`                                 | la chaîne correspond à la regex (dans `[[ ]]`)                                        |
| `&&`, `\|\|`, `!`                            | et, ou, non                                                                           |

## 8. Accès à distance

| Commande                         | Nom complet                               | Ce qu'elle fait                                                                                                                                                                              |
| -------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ssh login@machine`              | Secure SHell                              | Ouvre un shell sur une autre machine. `exit` ou `Ctrl-d` pour en sortir. Les fichiers du répertoire personnel sont les mêmes partout ; `/tmp` et `/etc/hosts` sont propres à chaque machine. |
| `ssh -X login@machine`           | ssh with X11 forwarding (redirection X11) | Permet à des programmes graphiques (ex. `xeyes`) de tourner à distance et de s'afficher sur votre écran.                                                                                     |
| `scp file login@machine:/tmp`    | Secure CoPy                               | Copie un fichier local vers un répertoire distant via ssh.                                                                                                                                   |
| `scp login@machine:/path/file .` | Secure CoPy                               | Copie un fichier distant dans le répertoire local courant.                                                                                                                                   |
| `scp -r dir login@machine:dest`  | Secure CoPy, recursive                    | Copie un répertoire entier.                                                                                                                                                                  |
| `hostname`, `who`, `whoami`      |                                           | Vérifier sur quelle machine vous êtes et qui est connecté.                                                                                                                                   |

Unix est multitâche et multi-utilisateur : plusieurs utilisateurs peuvent être connectés à la même machine en même temps.

## 9. Processus, jobs, priorités et signaux

### Observer les processus

| Commande    | Nom complet                                    | Ce qu'elle fait                                                                     |
| ----------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ps`        | process status                                 | Processus de votre terminal courant.                                                |
| `ps aux`    | process status, all users, user format, no tty | Tous les processus du système (utilisateur, PID, %CPU, %MEM, STAT, commande).       |
| `ps -ef`    | process status, every, full                    | Autre forme courante ; affiche le PID **et le PPID** (PID du parent).               |
| `pstree`    | process tree                                   | Affiche les processus sous forme d'arbre parent/enfant. `pstree -p` ajoute les PID. |
| `htop`      | htop                                           | Visualiseur interactif de processus ; `F4` filtrer, `F9` tuer, `F7`/`F8` nice.      |
| `watch cmd` | watch                                          | Relance une commande à intervalles réguliers (2 s par défaut) : `watch ps`.         |
| `tty`       | teletype                                       | Terminal du shell courant.                                                          |

**États des processus (colonne STAT) :** `R` en cours d'exécution, `S` endormi (en attente), `T` arrêté (suspendu), `Z` zombie (terminé, le parent n'a pas lu son code de retour), `D` attente d'E/S non interruptible. `+` = job au premier plan.

Observations du TP : un pipeline `cat \| tail \| wc` crée **3 processus en même temps**, tous enfants du même shell. `xeyes` lancé depuis un terminal a le shell pour parent, et l'émulateur de terminal pour grand-parent.

### Jobs (contrôle des jobs par le shell)

| Commande / touche | Nom complet               | Ce qu'elle fait                                                |
| ----------------- | ------------------------- | -------------------------------------------------------------- |
| `cmd &`           | background (arrière-plan) | Lance la commande en arrière-plan ; le shell reste utilisable. |
| `Ctrl-z`          | suspend (SIGTSTP)         | Arrête le job au premier plan (état `T`).                      |
| `Ctrl-c`          | interrupt (SIGINT)        | Termine le job au premier plan.                                |
| `bg [%N]`         | background                | Relance un job arrêté en arrière-plan.                         |
| `fg [%N]`         | foreground                | Ramène un job au premier plan.                                 |
| `jobs`            | jobs                      | Liste les jobs de ce shell avec leur numéro et leur état.      |
| `kill %N`         | kill (job)                | Envoie SIGTERM au job numéro N.                                |

### Priorités (niceness)

La niceness va de -20 (gourmand, haute priorité) à +19 (très poli, basse priorité) ; 0 par défaut. Seul root peut la descendre en dessous de 0.

| Commande           | Nom complet | Ce qu'elle fait                                                                 |
| ------------------ | ----------- | ------------------------------------------------------------------------------- |
| `nice`             | nice        | Sans argument : affiche la niceness courante.                                   |
| `nice -n 10 cmd`   | nice        | Lance `cmd` avec une niceness de 10.                                            |
| `renice 10 -p PID` | renice      | Change la niceness d'un processus en cours. `renice 1 -p $$` = le bash courant. |

La _niceness_ indique à quel point le processus est poli ; la _priorité_ est l'importance que l'ordonnanceur lui accorde réellement, calculée à partir des besoins du système et de la niceness. Une niceness élevée (19) reçoit moins de CPU quand le CPU est saturé.

### Signaux

| Commande                            | Nom complet | Ce qu'elle fait                                                        |
| ----------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `kill -l`                           | kill, list  | Liste tous les signaux avec leurs numéros.                             |
| `kill PID`                          | kill        | Envoie SIGTERM (15, demande de terminaison polie) à PID.               |
| `kill -N PID` / `kill -SIGNAME PID` | kill        | Envoie le signal N (ex. `kill -9 PID`, `kill -USR1 PID`).              |
| `killall name`                      | kill all    | Envoie un signal à tous les processus portant ce nom (`killall gzip`). |

| Signal    | N   | Signification                                                                    |
| --------- | --- | -------------------------------------------------------------------------------- |
| `SIGHUP`  | 1   | Raccrochage (terminal fermé) ; souvent « recharger la configuration »            |
| `SIGINT`  | 2   | Interruption (`Ctrl-c`)                                                          |
| `SIGKILL` | 9   | Tue immédiatement ; **ne peut être ni intercepté ni ignoré**                     |
| `SIGUSR1` | 10  | Signal défini par l'utilisateur (utilisé dans l'exercice « You talkin' to me? ») |
| `SIGTERM` | 15  | Demande de terminaison polie (signal par défaut de `kill`)                       |
| `SIGCONT` | 18  | Fait reprendre un processus arrêté                                               |
| `SIGSTOP` | 19  | Arrête (met en pause) un processus ; ne peut pas être intercepté                 |
| `SIGTSTP` | 20  | Arrêt depuis le terminal (`Ctrl-z`) ; peut être intercepté                       |

Les numéros sont ceux de Linux x86 (vérifier avec `kill -l`).

Exemple : `xeyes &` puis `kill -STOP PID` (le fige), `kill -CONT PID` (le relance), `kill PID` (le termine).

## 10. Communication inter-processus et appels système C

### Commandes shell pour l'IPC

| Commande                | Nom complet    | Ce qu'elle fait                                                                                                                                                              |
| ----------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ipcs`                  | IPC status     | Liste les objets IPC System V : segments de mémoire partagée, sémaphores, files de messages. Affiche la clé, l'id, le propriétaire, `nattch` (nombre de processus attachés). |
| `ipcs -m` / `-s` / `-q` | IPC status     | Seulement la mémoire partagée / les sémaphores / les files de messages.                                                                                                      |
| `ipcrm -m id`           | IPC remove     | Supprime un segment de mémoire partagée par son id.                                                                                                                          |
| `ipcrm -s id`           | IPC remove     | Supprime un ensemble de sémaphores par son id.                                                                                                                               |
| `gcc prog.c -o prog`    | GNU C Compiler | Compile un programme C en un exécutable (ex. `init`, `compteur`).                                                                                                            |

### Création de processus (C)

| Appel                                    | Ce qu'il fait                                                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pid_t fork(void)`                       | Duplique le processus. Renvoie **0 dans le fils**, le PID du fils dans le père, -1 en cas d'erreur.                                                                                              |
| `execlp("cmd", "cmd", NULL)`             | Remplace (« recouvrement ») le programme courant par `cmd`, cherché dans le `PATH`. Ne revient qu'en cas d'erreur, c'est pourquoi le message d'erreur n'apparaît que pour une mauvaise commande. |
| `wait(&status)` / `waitpid(pid, ...)`    | Le père attend la fin d'un fils ; évite les zombies.                                                                                                                                             |
| `getpid()` / `getppid()`                 | PID du processus / de son père.                                                                                                                                                                  |
| `exit(n)`                                | Termine le processus avec le code n.                                                                                                                                                             |
| `int pipe(int fd[2])`                    | Crée un tube anonyme : `fd[0]` = extrémité de lecture, `fd[1]` = extrémité d'écriture.                                                                                                           |
| `close(fd)`                              | Ferme un descripteur. Chaque processus ferme l'extrémité du tube qu'il n'utilise pas (fils : écriture ; père : lecture).                                                                         |
| `write(fd, buf, n)` / `read(fd, buf, n)` | Écrit dans / lit depuis un descripteur.                                                                                                                                                          |

Comment le shell exécute une commande : une boucle qui attend votre saisie, puis `fork` + `exec`, puis `wait`. Les orphelins (dont le père est mort en premier) sont adoptés par `init`/`systemd` ; un fils terminé qui n'a pas été attendu est un zombie (exercice « The Walking Dead »).

### Signaux (C)

| Appel                                                   | Ce qu'il fait                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `int kill(pid_t pid, int sig)`                          | Équivalent C de la commande `kill`.                                                                                                       |
| `sighandler_t signal(int signum, sighandler_t handler)` | Enregistre une fonction gestionnaire appelée quand `signum` arrive (ex. `signal(SIGUSR1, handler)`). `typedef void (*sighandler_t)(int)`. |
| `pause()`                                               | Dort jusqu'à l'arrivée d'un signal.                                                                                                       |

### Mémoire partagée (System V)

| Appel                                  | Nom complet           | Ce qu'il fait                                                                 |
| -------------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| `ftok(path, id)`                       | file to key           | Construit une clé IPC à partir d'un chemin de fichier et d'un entier.         |
| `shmget(key, size, IPC_CREAT \| 0600)` | shared memory get     | Crée ou récupère un segment et renvoie son id.                                |
| `shmat(id, NULL, 0)`                   | shared memory attach  | Attache le segment à l'espace d'adressage du processus ; renvoie un pointeur. |
| `shmdt(addr)`                          | shared memory detach  | Détache le segment (le segment existe toujours).                              |
| `shmctl(id, IPC_RMID, NULL)`           | shared memory control | Supprime le segment (ce que fait `liberation.c` ; comme `ipcrm -m`).          |

**Problème :** plusieurs processus `compteur` qui lisent et écrivent le même segment sans synchronisation entremêlent leurs lecture-modification-écriture (situation de concurrence), donc le compte final est faux (vérifier avec `sort file \| uniq -d` pour trouver les doublons, ou en comptant les lignes).

### Sémaphores (System V)

| Appel                                   | Nom complet         | Ce qu'il fait                                                                                 |
| --------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `semget(key, nsems, IPC_CREAT \| 0600)` | semaphore get       | Crée ou récupère un ensemble de sémaphores (utiliser une clé différente de celle du segment). |
| `semctl(semid, 0, SETVAL, 1)`           | semaphore control   | Initialise le sémaphore numéro 0 à la valeur 1 (un mutex).                                    |
| `semctl(semid, 0, IPC_RMID)`            | semaphore control   | Supprime l'ensemble de sémaphores.                                                            |
| `semop(semid, &op, 1)`                  | semaphore operation | Effectue P ou V selon `sem_op`.                                                               |
| `P(semid, n)`                           | proberen (attendre) | `sem_op = -1` : décrémente ; bloque si la valeur vaut 0. Entrée en section critique.          |
| `V(semid, n)`                           | verhogen (signaler) | `sem_op = +1` : incrémente ; réveille un processus en attente. Sortie de la section critique. |

Schéma : `P(semid, 0); /* critical section: read and write shared counter */ V(semid, 0);` Avec le sémaphore initialisé à 1, un seul `compteurSem` est en section critique à la fois, donc tous les comptes sont justes.

## 11. Mémoire cache : formules clés (exercice mémoire)

Pas de commandes shell dans ce document : c'est un exercice sur un cache pour une boucle en assembleur. Voici les formules standard pour le résoudre.

| Notion                                                     | Formule / règle                                                                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Taille d'un bloc (ligne)                                   | 32 octets, donc offset = 5 bits                                                                                                                                   |
| Nombre de blocs                                            | taille du cache / taille d'un bloc = 2 Ko / 32 o = 64 blocs                                                                                                       |
| Correspondance directe (CD)                                | index = 6 bits (64 ensembles) ; tag = bits d'adresse − 6 − 5 ; une seule place possible par bloc                                                                  |
| Associatif à 2 voies (CA)                                  | ensembles = 64 / 2 = 32, donc index = 5 bits ; tag = bits d'adresse − 5 − 5 ; 2 places par ensemble                                                               |
| Découpage de l'adresse                                     | `tag \| index \| offset`                                                                                                                                          |
| Succès (hit)                                               | Donnée trouvée dans le cache : coût Tc (10 ns)                                                                                                                    |
| Échec (miss), premier octet d'un bloc                      | Tm (70 ns) pour aller chercher le bloc en DRAM                                                                                                                    |
| Octets suivants du bloc (mode page)                        | Tp (25 ns) chacun : remplissage du bloc = Tm + 31 × Tp                                                                                                            |
| Sans cache                                                 | Temps total = (nombre d'accès mémoire) × Tm                                                                                                                       |
| Write-back (« écriture différée ») + write-allocate        | Les écritures vont seulement dans le cache (bit dirty) ; un échec en écriture charge d'abord le bloc ; le bloc modifié est réécrit en mémoire quand il est évincé |
| Write-through (« écriture immédiate ») + no-write-allocate | Chaque écriture va aussi en mémoire ; un échec en écriture ne charge pas le bloc                                                                                  |
| Accélération                                               | `S = T_without / T_with` ; facteur relatif CD/CA = `T_CD / T_CA`                                                                                                  |

**Pourquoi l'exercice fonctionne :** les adresses `BX` et `BX+2048` sont séparées de 2 Ko, exactement la taille du cache, donc dans un cache à correspondance directe elles tombent sur la **même ligne** et s'évincent mutuellement (défauts de conflit). Avec 2 voies, elles peuvent coexister dans le même ensemble.

**Conclusion type :** un seul petit benchmark ne suffit pas pour juger un cache ; les résultats dépendent du motif d'accès, il faut donc comparer sur des programmes variés.

## 12. EXAMEN 2017-2018 recréé

Système d'Exploitation — examen du ... — 2h00

**Éléments autorisés et interdits**

- les polycopiés et vos propres notes de cours sont autorisés (pas de photocopie)
- la copie de votre voisin n'est pas autorisée
- calculatrice interdite

**Remarque :** toute réponse à une question doit être justifiée (explication/calcul/observation)

### 1. Représentation des nombres [3 points]

On utilise la norme IEEE 754 simple précision (32 bits). Convertissez en base 10 les trois nombres suivants, donnés en hexadécimal :

1. `0x3F000000`
2. `0x7FC00000`
3. `0x41200000`

### 2. Commande `ls -R` et liens symboliques [3 points]

On exécute la commande `ls -lR` à la racine du système de fichiers et on obtient (extrait) :

```text
/tata:
total 0

/toto:
-rw-r--r-- 1 user user 120 fic1.doc
-rw-r--r-- 1 user user 340 fic2.doc
-rw-r--r-- 1 user user 560 fic3.docx
drwxr-xr-x 2 user user 4096 doc

/toto/doc:
lrwxrwxrwx 1 user user 8 lien1 -> ../fic1.doc
lrwxrwxrwx 1 user user 8 lien2 -> ../fic2.doc
```

On exécute ensuite la commande suivante (`mv` permet de déplacer des fichiers) :

```bash
mv /toto/*doc /tata
```

1. [1 pt] Que contient le répertoire `tata` après l'exécution de la commande ?
2. [1 pt] Cette commande présente un problème. Lequel ?
3. [1 pt] Comment peut-on résoudre ce problème ?

### 3. Sémaphores [4 points]

Soit une intersection de deux routes contrôlée par deux feux de circulation `F1` et `F2`. Les deux feux ne doivent **jamais** être verts en même temps.

1. [2 pts] À l'aide de sémaphores et des opérations `P` et `V`, écrivez le programme qui gère les feux `F1` et `F2` de façon à respecter cette contrainte. Précisez les sémaphores utilisés et leur valeur initiale.
2. [2 pts] On considère maintenant deux sémaphores `B1` et `B2` permettant d'éviter les collisions en ne laissant **qu'une seule voiture à la fois** dans l'intersection. Écrivez le programme d'une voiture arrivant par la route 1 puis celui d'une voiture arrivant par la route 2, en utilisant `P` et `V` sur `B1` et `B2`.

### 4. Ordonnancement [7 points]

Un professeur n'a qu'**une heure** à consacrer à ses élèves. Il reçoit les étudiants suivants, tous présents à l'instant 0 et arrivés dans l'ordre E1, ..., E6. Il met **1 minute** pour passer d'un étudiant à l'autre.

| Étudiant                   | E1  | E2  | E3  | E4  | E5  | E6  |
| -------------------------- | --- | --- | --- | --- | --- | --- |
| Durée de l'entretien (min) | 25  | 10  | 45  | 5   | 15  | 20  |

1. [4 pts] On veut savoir quelle politique d'ordonnancement permet au professeur de voir le plus d'élèves **complètement**. Pour chacune des politiques suivantes, dessinez le diagramme de Gantt et indiquez le nombre d'élèves vus complètement :
   - (a) premier arrivé, premier servi ;
   - (b) plus court d'abord ;
   - (c) tourniquet (quantum de 5 minutes).

   Concluez : quelle politique est la plus avantageuse pour le professeur ?

2. [2 pts]
   - (a) Pourquoi choisirait-on un petit quantum ?
   - (b) Pourquoi choisirait-on un grand quantum ?
3. [1 pt] Que se passe-t-il si l'on prend un quantum supérieur au plus grand temps d'exécution des processus proposés (ici 45 minutes) ?

### 5. Attention ça va couper ! [3 points]

Soit le fichier `fichier.txt` :

```text
alice:25:paris:france
bob:31:lyon:france
chloe:19:tunis:tunisie
david:25:madrid:espagne
eve::rome:italie
```

Donnez et expliquez le résultat des commandes suivantes :

1. `grep "france" fichier.txt | cut -d":" -f1,3 | sort -r`
2. `grep ":25:" fichier.txt | cut -d":" -f4 | sort`
3. `cut -d":" -f2 fichier.txt | sort -u`
