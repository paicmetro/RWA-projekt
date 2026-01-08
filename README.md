Kako runnati backend i frontend

backend:
otići u /backend
otvoriti cmd i napisati:
node app.js

frontend:
otići u /frontend
otvoriti cmd i napisati:
npm run dev

UPUTE GITHUB DESKTOP:

Prije rada (svaki put)

Klikni Fetch origin 

1) ZA DOBAVIT KOD KOD SEBE
Ako se pojavi Pull origin → prije pull-a provjeri imaš li local changes:
    Ako nemaš: klik Pull origin
    Ako imaš: commit ili stash (ispod)
    Ako imaš lokalne promjene, a trebaš povući tuđe

    Opcija A: Commit (preporuka)
        U “Changes” napiši poruku → Commit to main
        Zatim Pull origin
        Na kraju Push origin 


    Opcija B: Stash (kad nije spremno za commit)
        GitHub Desktop ima “stash changes” (privremeno makne izmjene, pa ih kasnije vrati). 
        Stash
        Pull origin
        Restore stashed changes
        
    Napomena: Desktop može držati jedan stash set u isto vrijeme. 

2) ZA PREBACIT SVOJ KOD GORE
Prije push-a
Klikni Fetch origin
Ako ima novih commitova: Pull origin
Tek onda Push origin 

Ako dođe do konflikta
Konflikt se dogodi kad 2 osobe promijene iste linije u istom fileu. Tada moraš ručno odabrati što ostaje.



