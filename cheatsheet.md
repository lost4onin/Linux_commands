# Linux / Unix Commands Cheat Sheet (Operating Systems exam)

Nov 7, 2026 · @akrem

Every command from your 5 course documents (TP1 Unix basics, Shell interpreter, TP4 Files, TP5 Processes, Cache memory), grouped by what it does, with full name and a one-line explanation.

## 0. Conventions, tools and directories

### Notation used in this sheet

| Symbol | Meaning |
| --- | --- |
| `$` | Shell prompt (normal user). Do not type it. |
| `#` | Comment in a script (but `#!` on line 1 = shebang). |
| `[ ... ]` | Optional argument |
| `-x`, `--long` | Short option / long option |
| `~` | Your home directory (`$HOME`) |
| `.` / `..` | Current directory / parent directory |
| `/` | Root of the file system; also the path separator |
| `-` | With `cd -`: previous directory |
| `*` `?` `[a-z]` | Wildcards (globbing): any string / one character / one character in a set |
| `$VAR`, `${VAR}` | Value of a variable |
| `$(cmd)` | Output of a command (command substitution) |
| `$$` | PID of the current shell |
| `$?` | Exit status of the last command (0 = success) |
| `Ctrl-c` / `Ctrl-z` / `Ctrl-d` | Interrupt (SIGINT) / suspend (SIGTSTP) / end of input (EOF) or logout |
| `Ctrl-r` | Reverse search in the command history |

### Man page sections (`man N cmd`)

| N | Content | Example |
| --- | --- | --- |
| 1 | User commands | `man 1 mkdir` (the command) |
| 2 | System calls | `man 2 mkdir` (the C function) |
| 3 | C library functions | `man 3 printf` |
| 5 | File formats / configuration | `man 5 passwd` |
| 7 | Miscellaneous (regex, signals...) | `man 7 regex` |

### Tools and shells

| Tool | Full name | Role |
| --- | --- | --- |
| `bash` | Bourne Again SHell | Default command interpreter on Linux (improved Bourne shell `sh`). Runs commands and scripts. |
| `man` | manual | Reference manual pages |
| `info` | GNU info | Longer documentation than man (needed for `sed`) |
| `htop` | interactive process viewer | Colourful improved `top` |
| `ssh` | Secure SHell | Secure remote login |
| `gcc` | GNU C Compiler | Compiles the C programs of TP5 |
| `xeyes` | X eyes | Tiny graphical (X11) program used to test processes and `ssh -X` |

### Important directories

| Directory | Content |
| --- | --- |
| `/` | Root of the whole tree |
| `/home/login` (= `~`) | Personal files; same on every machine of the school network |
| `/tmp` | Temporary files; local to each machine |
| `/etc` | System configuration (`/etc/hosts`, `/etc/hostname`, `/etc/passwd`, `/etc/profile`) |
| `/bin`, `/usr/bin` | Standard commands (executables) |
| `$HOME/bin` | Your personal scripts (added at the front of `PATH`) |
| `/dev` | Devices as files (`/dev/null`, terminals such as `/dev/pts/0`) |
| `/opt` | Optional software (the Ubuntu ISO of TP5 is in `/opt/iso`) |
| `/proc` | Virtual files describing running processes |

### Configuration files of bash

| File | When it runs |
| --- | --- |
| `/etc/profile` | Login shell, for all users |
| `~/.bash_profile`, `~/.bash_login`, `~/.profile` | Login shell, per user (first one found) |
| `~/.bashrc` | Non-login shells (each new terminal). Put aliases, `export`, `PATH` and `PS1` here to make them permanent. |
| `~/.bash_logout` | At logout |

### Important environment variables

| Variable | Meaning |
| --- | --- |
| `PATH` | Colon-separated list of directories searched for commands |
| `HOME` | Home directory |
| `USER` | Login name |
| `PS1` | The prompt format |
| `SHELL` | Path of the login shell |
| `PWD` / `OLDPWD` | Current / previous directory |

### File types (first character of `ls -l`)

| Char | Type |
| --- | --- |
| `-` | Ordinary file |
| `d` | Directory |
| `l` | Symbolic link |
| `c` / `b` | Character / block device |
| `p` | Pipe (named pipe, FIFO) |
| `s` | Socket |

### Standard streams (file descriptors)

| Number | Name | Default |
| --- | --- | --- |
| 0 | stdin (standard input) | Keyboard |
| 1 | stdout (standard output) | Screen |
| 2 | stderr (standard error) | Screen |

## 1. Help and documentation

| Command | Full name | What it does |
| --- | --- | --- |
| `man cmd` | manual | Shows the manual page of a command. First reflex: RTFM ("Read The F... Manual"). Navigate with arrows, `/word` to search, `q` to quit. |
| `man N cmd` | manual, section N | Picks the section: `man 1 mkdir` = shell command, `man 2 mkdir` = system call. |
| `man -k word` | manual, keyword | Searches the manual page names/descriptions for a keyword. Same as `apropos word`. |
| `apropos word` | apropos ("about") | Equivalent of `man -k`: lists manuals related to a keyword. |
| `info cmd` | GNU info | Longer hypertext docs (needed for `sed`). Keys: `n` next, `p` prev, `u` up, Enter follows a link, `q` quits. |
| `history` | command history | Lists the commands you typed (see section 8 for `!!`, `!n`). |

## 2. Navigation and directories

| Command | Full name | What it does |
| --- | --- | --- |
| `pwd` | print working directory | Prints the absolute path of the current directory. |
| `cd dir` | change directory | Moves to `dir`. |
| `cd` or `cd ~` | change directory (home) | Goes back to your home directory. |
| `cd -` | change directory (previous) | Returns to the previous directory (toggles between two). |
| `cd ..` | change directory (parent) | Goes up one level (`..` = parent). |
| `cd .` | change directory (current) | Stays here (`.` = current directory). |
| `ls` | list | Lists directory content. |
| `ls -l` | list, long format | Permissions, links, owner, group, size, date, name. |
| `ls -a` | list, all | Includes hidden files (names starting with `.`). |
| `ls -al` | list, all, long | Long format with hidden files (explains: type, rights, link count, owner, group, size, date, name). |
| `ls -i` | list, inode | Shows the i-node number of each file. |
| `ls -R` | list, recursive | Lists subdirectories recursively (`ls -lR /` = the whole tree). |
| `mkdir dir` | make directory | Creates a directory. |
| `mkdir -p a/b/c` | make directory, parents | Creates the whole path in one command (e.g. `~/TestASI/SE/TP/Num2`). |
| `mkdir d1 d2 d3` | make directory | Creates several directories at the same level at once. |
| `rmdir dir` | remove directory | Deletes an **empty** directory only. |
| `rmdir -p a/b/c` | remove directory, parents | Deletes `a/b/c`, then `a/b`, then `a` if each becomes empty. |

## 3. Files: create, copy, move, delete, view, links, inspect

| Command | Full name | What it does |
| --- | --- | --- |
| `touch file` | touch | Creates an empty file (or updates its timestamp). |
| `cat file` | concatenate | Prints file content; concatenates several files. |
| `cat > file` | concatenate (to file) | Creates a file from the keyboard; finish with `Ctrl-d`. |
| `less file` | less (opposite of "more") | Scrollable pager: arrows/space to move, `/word` to search, `q` to quit. |
| `cp src dest` | copy | Copies a file. If `dest` is a directory, keeps the name. `cp /etc/hosts .` copies into the current directory. |
| `cp src newname` | copy | Copies and renames on the fly (`cp /etc/hosts hostsBis`). |
| `cp -r dir1 dir2` | copy, recursive | Copies a whole directory (e.g. `cp -r ~/TPSE1 /tmp/`). |
| `mv src dest` | move | Moves a file or directory; also **renames** (`mv hostsBis hosts2`). |
| `rm file` | remove | Deletes a file (no recycle bin!). |
| `rm -r dir` | remove, recursive | Deletes a directory and all its content. |
| `rm -rf dir` | remove, recursive, force | Same without confirmation or errors. Dangerous. |
| `ln src link` | link | Creates a **hard link**: another name for the same i-node (same file, same i-node number). |
| `ln -s target link` | link, symbolic | Creates a **symbolic link** (type `l`): a small file containing a path. Has its own i-node. |
| `file name` | file | Gives the type of a file from its content (text, ELF executable, ...). |
| `stat file` | status | Detailed info: size, i-node, links count, rights, owner, dates. |
| `basename path [suffix]` | base name | Removes the directory part (and optional suffix): `basename /a/b/x.txt .txt` gives `x`. |
| `dirname path` | directory name | Keeps only the directory part: `dirname /a/b/x.txt` gives `/a/b`. |
| `find dir -name "*.txt"` | find | Searches a directory tree. |
| `find dir -name "*.c" -size +500c` | find | Filters by name and size (`c` = bytes, `k` = KB, `M` = MB; `+` = bigger than). |
| `find dir -type f` / `-type d` | find, type | Only files / only directories. |

**Hard link vs symbolic link**

|  | Hard link (`ln`) | Symbolic link (`ln -s`) |
| --- | --- | --- |
| i-node | Same as the original | Its own i-node |
| Type in `ls -l` | `-` (ordinary file) | `l` |
| Link count (number after rights) | Increases | Unchanged |
| Across file systems (e.g. to `/tmp`) | Impossible | Possible |
| On a directory | Not allowed | Possible |
| Original deleted | Data still accessible | Link is broken (dangling) |

**i-node behaviour (TP4)**

- `cp` creates a new file, so a **new** i-node.
- `mv` inside the same file system keeps the same i-node (only the directory entry changes).
- `mv` to another file system (e.g. `/tmp`) = copy + delete, so the i-node **changes**.
- The number after the rights in `ls -l` is the hard-link count.

## 4. Permissions, users and groups

| Command | Full name | What it does |
| --- | --- | --- |
| `chmod 750 file` | change mode | Sets rights in **octal** (r=4, w=2, x=1): owner `rwx`, group `r-x`, others `---`. Only the owner can do it. |
| `chmod g+w file` | change mode (symbolic) | Adds write for the group. Who: `u` user/owner, `g` group, `o` others, `a` all. Operator: `+` add, `-` remove, `=` set. |
| `chmod u+x file` | change mode | Makes a file executable by its owner (alias `exe`). |
| `chmod u-x file` | change mode | Removes execute right (alias `unexe`). |
| `chmod u-w file` | change mode | Owner can no longer modify the file (alias `protect`); `u+w` = `unprotect`. |
| `groups [user]` | groups | Lists the groups a user belongs to. |
| `id` | identity | Shows UID, GID and groups of the current user. |
| `whoami` | who am I | Prints your login name. |

**Reading `ls -l`:** `-rwxr-x--- 1 login group 1024 Nov 7 12:00 file`

| Field | Meaning |
| --- | --- |
| `-` | File type (see section 0) |
| `rwx` `r-x` `---` | Rights of owner (u), group (g), others (o) |
| `1` | Hard-link count |
| `login` / `group` | Owner / owning group |
| `1024` | Size in bytes |
| date, name | Last modification, file name |

**Rights:** `r` read (4), `w` write (2), `x` execute (1). On a **directory**, `x` means permission to enter it (`cd`, access its files).

| Octal | Symbolic | Octal | Symbolic |
| --- | --- | --- | --- |
| 7 | `rwx` | 3 | `-wx` |
| 6 | `rw-` | 2 | `-w-` |
| 5 | `r-x` | 1 | `--x` |
| 4 | `r--` | 0 | `---` |

## 5. Disk, system and user information

| Command | Full name | What it does |
| --- | --- | --- |
| `du` | disk usage | Space used by files/directories. `du -sh dir` = total of `dir`, human-readable. |
| `df` | disk free | Free/used space of each mounted file system. `df -h` = human-readable (K, M, G). |
| `quota` | quota | Shows your disk quota (allowed space) and current usage. |
| `hostname` | host name | Prints the machine name. |
| `who` | who | Lists users currently logged in (with terminal and login time). |
| `whoami` | who am I | Your login name. |
| `id` | identity | UID, GID, groups. |
| `tty` | teletype | Prints the device file of the current terminal (e.g. `/dev/pts/0`). |
| `getent passwd` | get entries | Lists all accounts from the system database (local + network). Fields: see below. |
| `exit` or `Ctrl-d` | exit | Ends the shell / ssh session. |

**Fields of a `passwd` line** (separated by `:`)

`login : password(x) : UID : GID : full name : home directory : login shell`

- Fields 1, 6, 7 = login, home directory, shell.
- Fields 3, 4 = UID (user id), GID (primary group id) — same as given by `id`.

## 6. Redirections, pipes and text filters

### Redirections and pipes

| Syntax | Name | What it does |
| --- | --- | --- |
| `cmd > file` | redirect stdout (overwrite) | Writes output into `file`, **erasing** previous content. |
| `cmd >> file` | redirect stdout (append) | Adds the output at the **end** of `file`. |
| `cmd < file` | redirect stdin | Reads input from `file`. |
| `cmd 2> file` | redirect stderr | Sends error messages to `file`. |
| `cmd > /dev/null` | null device | Throws the output away. |
| `cmd1 \| cmd2` | pipe (tube) | Output of `cmd1` becomes input of `cmd2`. Both processes run at the same time. |
| `cat << EOF ... EOF` | here document | Feeds the lines up to `EOF` as input; handy for multi-line messages in scripts. |
| `sort f > f` | **pitfall** | Truncates `f` before sort reads it: file lost. Use `sort f > tmp && mv tmp f` or `sort -o f f`. |

### Filters

| Command | Full name | What it does |
| --- | --- | --- |
| `grep pat file` | global regular expression print | Prints lines matching the pattern. |
| `grep -E "a\|b"` | grep, extended regex | Uses extended regular expressions (`\|`, `+`, `?`, `()`). |
| `grep -v pat` | grep, invert | Lines that do **not** match. |
| `grep -i pat` | grep, ignore case | Case-insensitive search. |
| `cut -d: -f1 file` | cut | Extracts column(s): `-d` delimiter, `-f` field number(s) (`-f1,6`). |
| `sort file` | sort | Sorts lines alphabetically. `-r` reverse, `-n` numeric, `-u` unique, `-t: -k3` by field. |
| `head -n 7 file` | head | First 7 lines (default 10). |
| `tail -n 7 file` | tail | Last 7 lines (default 10). `tail -f` follows a growing file. |
| `wc` | word count | Counts lines, words, bytes. `wc -l` = lines only. |
| `uniq` | unique | Removes adjacent duplicate lines (use after `sort`). |
| `sed` | stream editor | Line editor: add, delete, substitute lines (details below). |

Example chain: `getent passwd | cut -d: -f1 | grep u | sort | head -n 7`

### Regular expressions (regex, `man 7 regex`)

| Symbol | Meaning | Example |
| --- | --- | --- |
| `.` | Any single character | `z.e` matches "zoe" |
| `^` | Start of line | `^a` lines starting with a |
| `$` | End of line | `e$` lines ending with e |
| `[abc]` | One of the listed characters | `[ze]` |
| `[a-d]` | One character in a range | `^[a-d]l` |
| `[^l]` | Any character **except** l (negation) | `a[^l]a` |
| `a\|b` | a or b (alternation) | `oz\|zo` |
| `*` | Zero or more of the previous | `ab*` |
| `+` | One or more of the previous | `ua+` |
| `?` | Zero or one of the previous | `abl?` |
| `(...)` | Group | `(al\|abl)` |
| `\` | Escape a special character | `\.` |

Typical answers: starts with a or b → `^[ab]`; contains u then at least one a → `ua+`; "al" or "abl" → `ab?l`; a then z in order → `a.*z`; no l followed by a vowel → `grep -v "l[aeiou]"`.

### sed (stream editor): `sed [options] 'script' file`

| Command | What it does |
| --- | --- |
| `sed '/a/d' f` | **d**elete lines containing an "a" |
| `sed 's/:/#/g' f` | **s**ubstitute `:` by `#` (`g` = every occurrence on the line) |
| `sed 's/^/<</' f` | Add `<<` at the start of each line |
| `sed -e 's/^/<</' -e 's/$/>>/' f` | Two commands (`-e`): `<<` at start and `>>` at end |
| `sed -E 's/^[^:]*/XX/' f` | `-E` = extended regex; replaces the login (first field) by XX |
| `sed -E 's/^([^:]*):([^:]*):(.*):([^:]*)$/\1:\2:\3:\4/'` | Groups `( )` captured and reused as `\1`, `\2` ... to swap/reorder columns |
| `sed -i ...` | Edit the file **in place** |
| `sed -n '5p' f` | Print only line 5 (`-n` silences automatic printing) |

## 7. Bash shell: environment, history, aliases, scripting

### Environment and variables

| Command | Full name | What it does |
| --- | --- | --- |
| `env` | environment | Lists all environment variables. |
| `echo $VAR` | echo | Prints a variable's value. |
| `VAR=value` | assignment | Sets a variable (no spaces around `=`); **local** to this shell. |
| `export VAR=value` | export | Sets a variable and passes it to **child processes**. |
| `export PATH=$HOME/bin:$PATH` | export | Adds `~/bin` at the **front** of `PATH` (personal scripts get priority). Put it in `~/.bashrc` to make it permanent. |
| `export PS1="(\u@\h) \w$ "` | prompt string 1 | Changes the prompt: `\u` user, `\h` host, `\w` directory. Example with parentheses around login@machine. |
| `source file` or `. file` | source | Runs a file in the **current** shell (e.g. `source ~/.bashrc` to reload). |
| `alias name='cmd'` | alias | Shortcut for a command (`alias ll='ls -l'`). Put in `~/.bashrc` to keep it. `unalias name` removes it. |

### History

| Syntax | What it does |
| --- | --- |
| `history` | Lists numbered past commands |
| Up / Down arrows | Browse previous commands |
| `Ctrl-r` + text | Reverse-search; press again for older matches, Enter to run |
| `!!` | Re-run the last command |
| `!mk` | Re-run the last command starting with "mk" |
| `!-2` | Re-run the command 2 before the last |
| `!5` | Re-run command number 5 of `history` |

### Expansions (done by the shell **before** running the command)

| Syntax | Meaning |
| --- | --- |
| `$VAR` / `${VAR}` | Variable value |
| `$((expr))` | Arithmetic: `echo $((3+4))` gives 7 |
| `$(cmd)` or `` `cmd` `` | Output of a command: `echo $(date)` |
| `*` | Any string (all files of the directory) |
| `?` | Exactly one character |
| `[a-z]` | One character in the range |
| `{a,b,c}` | Brace expansion (`mkdir d{1,2,3}`) |
| `~` | Home directory |

Quotes: `"..."` keeps `$` expansion; `'...'` takes everything literally; `\` escapes one character.

### Script basics

| Item | Syntax / use |
| --- | --- |
| Shebang | `#!/bin/bash` on the **first line**: names the interpreter. |
| Make executable | `chmod u+x script.sh`, then run `./script.sh` (or via `PATH`). Without `x`: `bash script.sh`. |
| Why `./` | The current directory is not in `PATH`; the shell searches only `PATH` directories. |
| Output | `echo text` |
| Read input | `read var` |
| Exit status | `exit N` ends the script with code N; `$?` holds the last status (0 = OK). |
| Here document | `cat << EOF` ... `EOF` prints a multi-line message (usage text). |
| Generate numbers | `seq 1 20` prints 1 to 20 (`for i in $(seq 1 20)`). |

### Special variables

| Variable | Meaning |
| --- | --- |
| `$0` | Name of the script |
| `$1`, `$2`, ... | Arguments 1, 2, ... |
| `$#` | Number of arguments |
| `$*` | All arguments as one single word (inside quotes) |
| `$@` | All arguments, each kept as a separate word (inside quotes) |
| `$?` | Exit status of last command |
| `$$` | PID of the shell/script |
| `$!` | PID of the last background process |

### Control structures

```bash
# if / elif / else  ([[ ... ]] evolved from test and [ ... ])
if [[ $# -lt 2 ]]; then
    echo "usage: $0 a b"
elif [[ $(( $1 % 2 )) -eq 0 ]]; then
    echo even
else
    echo odd
fi

# for loop
for f in $(ls dir); do echo "$f"; done
for i in $(seq 1 5); do echo $i; done

# regex comparison (check a number)
[[ $2 =~ ^[0-9]+$ ]] || echo "not a number"

# rename: replace pattern1 by pattern2 in a file name
new=$(echo "$f" | sed "s/$p1/$p2/")
mv "$f" "$new"
```

| Test | True when |
| --- | --- |
| `-f x` / `-d x` / `-e x` | x is a regular file / a directory / exists |
| `-r x` / `-w x` / `-x x` | x is readable / writable / executable |
| `-z s` / `-n s` | string is empty / non-empty |
| `a -eq b`, `-ne`, `-lt`, `-le`, `-gt`, `-ge` | integer equal, not equal, less, less or equal, greater, greater or equal |
| `s1 == s2`, `s1 != s2` | strings equal / different |
| `s =~ regex` | string matches the regex (inside `[[ ]]`) |
| `&&`, `\|\|`, `!` | and, or, not |

## 8. Remote access

| Command | Full name | What it does |
| --- | --- | --- |
| `ssh login@machine` | Secure SHell | Opens a shell on another machine. `exit` or `Ctrl-d` to leave. Home files are the same everywhere; `/tmp`, `/etc/hosts` are per machine. |
| `ssh -X login@machine` | ssh with X11 forwarding | Lets graphical programs (e.g. `xeyes`) run remotely and display on your screen. |
| `scp file login@machine:/tmp` | Secure CoPy | Copies a local file to a remote directory over ssh. |
| `scp login@machine:/path/file .` | Secure CoPy | Copies a remote file to the current local directory. |
| `scp -r dir login@machine:dest` | Secure CoPy, recursive | Copies a whole directory. |
| `hostname`, `who`, `whoami` |  | Check which machine you are on and who is logged in. |

Unix is multi-tasking and multi-user: several users can be connected to the same machine at once.

## 9. Processes, jobs, priorities and signals

### Observing processes

| Command | Full name | What it does |
| --- | --- | --- |
| `ps` | process status | Processes of your current terminal. |
| `ps aux` | process status, all users, user format, no tty | Every process on the system (user, PID, %CPU, %MEM, STAT, command). |
| `ps -ef` | process status, every, full | Another common form; shows PID **and PPID** (parent PID). |
| `pstree` | process tree | Displays processes as a parent/child tree. `pstree -p` adds PIDs. |
| `htop` | htop | Interactive process viewer; `F4` filter, `F9` kill, `F7`/`F8` nice. |
| `watch cmd` | watch | Re-runs a command at regular intervals (default 2 s): `watch ps`. |
| `tty` | teletype | Terminal device of the current shell. |

**Process states (STAT column):** `R` running, `S` sleeping (waiting), `T` stopped (suspended), `Z` zombie (finished, parent has not read its status), `D` uninterruptible I/O wait. `+` = foreground job.

Observations from the TP: a pipeline `cat \| tail \| wc` creates **3 processes at once**, all children of the same shell. `xeyes` launched from a terminal has the shell as parent, and the terminal emulator as grandparent.

### Jobs (shell job control)

| Command / key | Full name | What it does |
| --- | --- | --- |
| `cmd &` | background | Starts the command in the background; the shell stays usable. |
| `Ctrl-z` | suspend (SIGTSTP) | Stops the foreground job (state `T`). |
| `Ctrl-c` | interrupt (SIGINT) | Terminates the foreground job. |
| `bg [%N]` | background | Resumes a stopped job in the background. |
| `fg [%N]` | foreground | Brings a job back to the foreground. |
| `jobs` | jobs | Lists the jobs of this shell with their number and state. |
| `kill %N` | kill (job) | Sends SIGTERM to job number N. |

### Priorities (niceness)

Niceness ranges from -20 (greedy, high priority) to +19 (very polite, low priority); default 0. Only root can lower it below 0.

| Command | Full name | What it does |
| --- | --- | --- |
| `nice` | nice | With no argument: prints the current niceness. |
| `nice -n 10 cmd` | nice | Starts `cmd` with niceness 10. |
| `renice 10 -p PID` | renice | Changes niceness of a running process. `renice 1 -p $$` = the current bash. |

The *niceness* is how polite the process is; the *priority* is the importance the scheduler actually gives it, computed from system needs and niceness. A high niceness (19) gets less CPU when the CPU is saturated.

### Signals

| Command | Full name | What it does |
| --- | --- | --- |
| `kill -l` | kill, list | Lists all signals with their numbers. |
| `kill PID` | kill | Sends SIGTERM (15, polite termination) to PID. |
| `kill -N PID` / `kill -SIGNAME PID` | kill | Sends signal N (e.g. `kill -9 PID`, `kill -USR1 PID`). |
| `killall name` | kill all | Sends a signal to every process with that name (`killall gzip`). |

| Signal | N | Meaning |
| --- | --- | --- |
| `SIGHUP` | 1 | Hang up (terminal closed); often "reload config" |
| `SIGINT` | 2 | Interrupt (`Ctrl-c`) |
| `SIGKILL` | 9 | Kill immediately; **cannot be caught or ignored** |
| `SIGUSR1` | 10 | User-defined signal (used in the "You talkin' to me?" exercise) |
| `SIGTERM` | 15 | Polite termination request (default of `kill`) |
| `SIGCONT` | 18 | Continue a stopped process |
| `SIGSTOP` | 19 | Stop (pause) a process; cannot be caught |
| `SIGTSTP` | 20 | Terminal stop (`Ctrl-z`); can be caught |

Numbers are for Linux x86 (check with `kill -l`).

Example: `xeyes &` then `kill -STOP PID` (freezes it), `kill -CONT PID` (resumes), `kill PID` (ends it).

## 10. Inter-process communication and C system calls

### Shell commands for IPC

| Command | Full name | What it does |
| --- | --- | --- |
| `ipcs` | IPC status | Lists System V IPC objects: shared memory segments, semaphores, message queues. Shows key, id, owner, `nattch` (number of attached processes). |
| `ipcs -m` / `-s` / `-q` | IPC status | Only shared memory / semaphores / message queues. |
| `ipcrm -m id` | IPC remove | Deletes a shared memory segment by id. |
| `ipcrm -s id` | IPC remove | Deletes a semaphore set by id. |
| `gcc prog.c -o prog` | GNU C Compiler | Compiles a C program into an executable (e.g. `init`, `compteur`). |

### Process creation (C)

| Call | What it does |
| --- | --- |
| `pid_t fork(void)` | Duplicates the process. Returns **0 in the child**, the child's PID in the parent, -1 on error. |
| `execlp("cmd", "cmd", NULL)` | Replaces ("recouvrement") the current program by `cmd`, searched in `PATH`. Returns only on error, which is why the error message appears only for a bad command. |
| `wait(&status)` / `waitpid(pid, ...)` | The parent waits for a child to finish; prevents zombies. |
| `getpid()` / `getppid()` | PID of the process / of its parent. |
| `exit(n)` | Ends the process with status n. |
| `int pipe(int fd[2])` | Creates an anonymous pipe: `fd[0]` = read end, `fd[1]` = write end. |
| `close(fd)` | Closes a descriptor. Each process closes the pipe end it does not use (child: write end; parent: read end). |
| `write(fd, buf, n)` / `read(fd, buf, n)` | Write to / read from a descriptor. |

How the shell runs a command: loop that waits for your input, then `fork` + `exec`, then `wait`. Orphans (parent died first) are adopted by `init`/`systemd`; a finished child not waited for is a zombie ("The Walking Dead" exercise).

### Signals (C)

| Call | What it does |
| --- | --- |
| `int kill(pid_t pid, int sig)` | C equivalent of the `kill` command. |
| `sighandler_t signal(int signum, sighandler_t handler)` | Registers a handler function called when `signum` arrives (e.g. `signal(SIGUSR1, handler)`). `typedef void (*sighandler_t)(int)`. |
| `pause()` | Sleeps until a signal arrives. |

### Shared memory (System V)

| Call | Full name | What it does |
| --- | --- | --- |
| `ftok(path, id)` | file to key | Builds an IPC key from a file path and an integer. |
| `shmget(key, size, IPC_CREAT \| 0600)` | shared memory get | Creates/gets a segment and returns its id. |
| `shmat(id, NULL, 0)` | shared memory attach | Attaches the segment to the process's address space; returns a pointer. |
| `shmdt(addr)` | shared memory detach | Detaches the segment (the segment still exists). |
| `shmctl(id, IPC_RMID, NULL)` | shared memory control | Deletes the segment (what `liberation.c` does; same as `ipcrm -m`). |

**Problem:** several `compteur` processes reading and writing the same segment without synchronisation overlap their read-modify-write (race condition), so the final count is wrong (check with `sort file \| uniq -d` to find duplicates, or by counting lines).

### Semaphores (System V)

| Call | Full name | What it does |
| --- | --- | --- |
| `semget(key, nsems, IPC_CREAT \| 0600)` | semaphore get | Creates/gets a set of semaphores (use a key different from the segment's). |
| `semctl(semid, 0, SETVAL, 1)` | semaphore control | Initialises semaphore number 0 to value 1 (a mutex). |
| `semctl(semid, 0, IPC_RMID)` | semaphore control | Deletes the semaphore set. |
| `semop(semid, &op, 1)` | semaphore operation | Does P or V depending on `sem_op`. |
| `P(semid, n)` | proberen (wait) | `sem_op = -1`: decrement; blocks if value is 0. Enter the critical section. |
| `V(semid, n)` | verhogen (signal) | `sem_op = +1`: increment; wakes a waiter. Leave the critical section. |

Pattern: `P(semid, 0); /* critical section: read and write shared counter */ V(semid, 0);` With the semaphore initialised to 1, only one `compteurSem` is in the critical section at a time, so all counts are correct.

## 11. Cache memory: key formulas (memory exercise)

No shell commands in this document: it is an exercise on a cache for an assembly loop. These are the standard formulas to solve it.

| Notion | Formula / rule |
| --- | --- |
| Block (line) size | 32 bytes, so offset = 5 bits |
| Number of blocks | cache size / block size = 2 KB / 32 B = 64 blocks |
| Direct-mapped (CD) | index = 6 bits (64 sets); tag = address bits − 6 − 5; one possible place per block |
| 2-way set associative (CA) | sets = 64 / 2 = 32, so index = 5 bits; tag = address bits − 5 − 5; 2 places per set |
| Address split | `tag \| index \| offset` |
| Hit | Data found in cache: cost Tc (10 ns) |
| Miss, first byte of a block | Tm (70 ns) to fetch the block from DRAM |
| Following bytes of the block (page mode) | Tp (25 ns) each: block fill = Tm + 31 × Tp |
| Without cache | Total time = (number of memory accesses) × Tm |
| Write-back ("écriture différée") + write-allocate | Writes go to the cache only (dirty bit); a write miss loads the block first; dirty block written back on eviction |
| Write-through ("écriture immédiate") + no-write-allocate | Every write also goes to memory; a write miss does not load the block |
| Speed-up | `S = T_without / T_with`; relative factor CD/CA = `T_CD / T_CA` |

**Why the exercise works:** addresses `BX` and `BX+2048` are 2 KB apart, which is exactly the cache size, so in a direct-mapped cache they map to the **same line** and keep evicting each other (conflict misses). With 2 ways they can coexist in the same set.

**Typical conclusion:** one small benchmark is not enough to judge a cache; results depend on the access pattern, so compare on varied programs.

## 12. EXAM 2017-2018 recreated

Operating Systems — exam of ... — 2h00

**Allowed and forbidden materials**

- course handouts and your own lecture notes are allowed (no photocopies)
- copying from your neighbour is not allowed
- calculators are forbidden

**Note:** every answer must be justified (explanation/calculation/observation)

### 1. Number representation [3 points]

We use the IEEE 754 single-precision standard (32 bits). Convert the following three numbers, given in hexadecimal, to base 10:

1. `0x3F000000`
2. `0x7FC00000`
3. `0x41200000`

### 2. The `ls -R` command and symbolic links [3 points]

The command `ls -lR` is run at the root of the file system and gives (extract):

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

The following command is then run (`mv` moves files):

```bash
mv /toto/*doc /tata
```

1. [1 pt] What does the `tata` directory contain after the command has run?
2. [1 pt] This command causes a problem. Which one?
3. [1 pt] How can this problem be solved?

### 3. Semaphores [4 points]

An intersection of two roads is controlled by two traffic lights `F1` and `F2`. The two lights must **never** be green at the same time.

1. [2 pts] Using semaphores and the `P` and `V` operations, write the program that controls lights `F1` and `F2` so that this constraint is respected. State the semaphores used and their initial values.
2. [2 pts] Now consider two semaphores `B1` and `B2` that prevent collisions by letting **only one car at a time** into the intersection. Write the program of a car arriving from road 1, then the program of a car arriving from road 2, using `P` and `V` on `B1` and `B2`.

### 4. Scheduling [7 points]

A teacher has only **one hour** to spend with students. The following students are all present at time 0 and arrived in the order E1, ..., E6. It takes the teacher **1 minute** to switch from one student to the next.

| Student | E1 | E2 | E3 | E4 | E5 | E6 |
| --- | --- | --- | --- | --- | --- | --- |
| Meeting length (min) | 25 | 10 | 45 | 5 | 15 | 20 |

1. [4 pts] We want to know which scheduling policy lets the teacher see the most students **completely**. For each of the following policies, draw the Gantt chart and give the number of students seen completely:
   - (a) first come, first served;
   - (b) shortest first;
   - (c) round robin (5-minute quantum).

   Conclude: which policy is the most advantageous for the teacher?
2. [2 pts]
   - (a) Why would one choose a small quantum?
   - (b) Why would one choose a large quantum?
3. [1 pt] What happens if the quantum is larger than the longest execution time of the given processes (here 45 minutes)?

### 5. Watch out, it's going to cut! [3 points]

Given the file `fichier.txt`:

```text
alice:25:paris:france
bob:31:lyon:france
chloe:19:tunis:tunisie
david:25:madrid:espagne
eve::rome:italie
```

Give and explain the output of the following commands:

1. `grep "france" fichier.txt | cut -d":" -f1,3 | sort -r`
2. `grep ":25:" fichier.txt | cut -d":" -f4 | sort`
3. `cut -d":" -f2 fichier.txt | sort -u`
