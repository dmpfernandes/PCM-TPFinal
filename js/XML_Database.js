class XML_Database {
    constructor () {

    }

    loadXMLfile (filename) {
        let xmlhttp = {};
        let xmlDoc = {};

        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        }
        xmlhttp.open("POST", filename, false);
        xmlhttp.send();
        xmlDoc = xmlhttp.responseXML;
        return xmlDoc;
    }

    SearchXML (query, xmlDoc, num_Img) {
        let Images_path = [];
        let x = xmlDoc.getElementsByClassName(query);
        if (num_Img > x.length) {
            num_Img = x.length;
        }

        for (let i = 0; i < num_Img; i++) {
            for (let j = 0; j < x[i].childNodes.length; j++) {
                if (x[i].childNodes[j].nodeName == "path") {
                    Images_path.push(x[i].childNodes[j].textContent);
                    break;
                }
            }
        }
        return Images_path;
    }
    //Non functional method
    SearchXMLColor(query, color,xmlDoc, num_Img) {
        let Images_path = [];
        let x = xmlDoc.getElementsByClassName(query);
        if (num_Img > x.length) {
            num_Img = x.length;
        }

        for (let i = 0; i < num_Img; i++) {
            for (let j = 0; j < x[i].childNodes.length; j++) {
                if (x[i].childNodes[j].nodeName === "dominantcolor") {
                    if( x[i].childNodes[j].textContent === color) {

                        x[i].childNodes.forEach(c => {
                            if(c.nodeName === "path"){
                                Images_path.push(c.textContent);
                            }

                        });
                        break;
                    }
                }
            }
        }
        return Images_path;
    }
}


class LocalStorageXML {

    constructor() {

    }

    saveLS_XML (keyname, xmlRowString) {
        if (typeof(localStorage) == 'undefined')
            alert('Your browser does not support HTML5 localStorage. Try upgrading.');
        else {
            try {
                localStorage.setItem(keyname, xmlRowString);
            }
            catch (e) {
                alert("save failed!");
                if (e == QUOTA_EXCEEDED_ERR)
                    alert('Quota exceeded!');
            }
        }
    }

    readLS_XML (keyname) {
        let localStorageRow = localStorage.getItem(keyname);

        if (window.DOMParser) {
            let parser = new DOMParser();
            return parser.parseFromString(localStorageRow, "text/xml");
        }
        else throw new TypeError("LocalStorageXML-readLS_XML: Error with DOMParser");
    }

}














    
    
   