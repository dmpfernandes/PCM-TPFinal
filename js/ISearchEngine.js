'use strict';

class ISearchEngine {
    constructor(dbase) {
        this.allpictures = new Pool(3000);
        this.colors = ["red", "orange", "yellow", "green", "Blue-green", "blue", "purple", "pink", "white", "grey", "black", "brown"];
        this.redColor = [204, 251, 255, 0, 3, 0, 118, 255, 255, 153, 0, 136];
        this.greenColor = [0, 148, 255, 204, 192, 0, 44, 152, 255, 153, 0, 84];
        this.blueColor = [0, 11, 0, 0, 198, 255, 167, 191, 255, 153, 0, 24];
        this.categories = ["beach", "birthday", "face", "indoor", "manmade/artificial", "manmade/manmade","manmade/urban", "marriage", "nature", "no_people", "outdoor", "party", "people", "snow"];
        this.XML_file = dbase;
        this.XML_db = new XML_Database();
        this.LS_db = new LocalStorageXML();
        this.num_Images = 1;
        this.numshownpic = 35;
        this.imgWidth = 190;
        this.imgHeight = 140;
        //array built to store the search by keywords image's path
        this.imagesToDisplay = [];
        //stores the category searched with search by keyword to know which category to filter by color
        this.category = null;
    }

    init(cnv) {
        this.databaseProcessing(cnv);

    }

    // method to build the database which is composed by all the pictures organized by the XML_Database file
    // At this initial stage, in order to evaluate the image algorithms, the method only compute one image.
    // However, after the initial stage the method must compute all the images in the XML file
    databaseProcessing (cnv) {
        let h12color = new ColorHistogram(this.redColor, this.greenColor, this.blueColor);
        let colmoments = new ColorMoments();
        let loadPics = this.XML_db.loadXMLfile(this.XML_file);
        let numCats = this.categories.length;
        //let img = new Picture(0, 0, 100, 100,"Images/daniel1.jpg", "test");
        for(let i = 0; i < numCats; i++) {
            let numPics = loadPics.getElementsByClassName(this.categories[i]);
            for (let j = 0; j < numPics.length; j++) {
                let img = new Picture(0, 0, 100, 100,"Images/" + this.categories[i] + "/img_" + (j+1) + ".jpg", this.categories[i]);

                let eventname = "processed_picture_" + img.impath;

                let eventP = new Event(eventname);
                let self = this;
                document.addEventListener(eventname, function () {
                    self.imageProcessed(img, eventname);
                }, false);

                img.computation(cnv, h12color, colmoments, eventP);
            }
        }
    }

    //When the event "processed_picture_" is enabled this method is called to check if all the images are
    //already processed. When all the images are processed, a database organized in XML is saved in the localStorage
    //to answer the queries related to Color and Image Example
    imageProcessed (img, eventname) {
        this.allpictures.insert(img);
        console.log("image processed " + this.allpictures.stuff.length + eventname);
        if (this.allpictures.stuff.length === (this.num_Images * this.categories.length)) {
            this.createXMLColordatabaseLS();
            //this.createXMLIExampledatabaseLS();
        }
    }

    //Method to create the XML database in the localStorage for color queries
    createXMLColordatabaseLS() {
        let idx = 0;
        let imageLS;
        let pathLS;
        let i = 0;
        for(let k = 0;k<this.categories.length;k++){
            let docLS = document.implementation.createDocument('','images',null);
            let rootLS = docLS.firstChild;
            for(;i<this.num_Images;i++) {
                if(this.allpictures.stuff[i].category !== this.categories[k]){
                    i--;
                    break;
                }
                //string que contem a cor dominante na img
                let clrSt = this.colors[idx];
                // create the <image>, <path> and text node
                imageLS = docLS.createElement("image");
                pathLS = docLS.createElement("path");

                let att = docLS.createAttribute("class");       // Create a "class" attribute
                att.value = clrSt;                           // Set the value of the class attribute
                imageLS.setAttributeNode(att);

                pathLS.appendChild(docLS.createTextNode(this.allpictures.stuff[i].impath));
                imageLS.appendChild(pathLS);
                rootLS.appendChild(imageLS);

                this.LS_db.saveLS_XML(this.categories[k], new XMLSerializer().serializeToString(rootLS));
            }
            console.log(rootLS);

        }


    }

    //Method to create the XML database in the localStorage for Image Example queries
    createXMLIExampledatabaseLS() {
        let list_images = new Pool(this.allpictures.stuff.length);
        this.zscoreNormalization();


        // this method should be completed by the students

    }

    //A good normalization of the data is very important to look for similar images. This method applies the
    // zscore normalization to the data
    zscoreNormalization() {
        let overaill_mean = [];
        let overall_std = [];

        // Inicialization
        for (let i = 0; i < this.allpictures.stuff[0].color_moments.length; i++) {
            overall_mean.push(0);
            overall_std.push(0);
        }

        // Mean computation I
        for (let i = 0; i < this.allpictures.stuff.length; i++) {
            for (let j = 0; j < this.allpictures.stuff[0].color_moments.length; j++) {
                overall_mean[j] += this.allpictures.stuff[i].color_moments[j];
            }
        }

        // Mean computation II
        for (let i = 0; i < this.allpictures.stuff[0].color_moments.length; i++) {
            overall_mean[i] /= this.allpictures.stuff.length;
        }

        // STD computation I
        for (let i = 0; i < this.allpictures.stuff.length; i++) {
            for (let j = 0; j < this.allpictures.stuff[0].color_moments.length; j++) {
                overall_std[j] += Math.pow((this.allpictures.stuff[i].color_moments[j] - overall_mean[j]), 2);
            }
        }

        // STD computation II
        for (let i = 0; i < this.allpictures.stuff[0].color_moments.length; i++) {
            overall_std[i] = Math.sqrt(overall_std[i]/this.allpictures.stuff.length);
        }

        // zscore normalization
        for (let i = 0; i < this.allpictures.stuff.length; i++) {
            for (let j = 0; j < this.allpictures.stuff[0].color_moments.length; j++) {
                this.allpictures.stuff[i].color_moments[j] = (this.allpictures.stuff[i].color_moments[j] - overall_mean[j]) / overall_std[j];
            }
        }
    }

    //Method to search images based on a selected color
    searchColor(category, color) {
        //let audio = document.getElementById("click");
        //audio.play();
        this.category = category;
        let r = 0;
        let g = 0;
        let b = 0;
        //this.count_Pixels = this.countPixels(cat);

        //console.log(this.count_Pixels)


        let canvas = document.querySelector("canvas");
        // let xmlDoc = this.XML_db.loadXMLfile(this.XML_file);
        let storageDoc = this.LS_db.readLS_XML(this.category);
        let num_Img = 30;
        console.log(storageDoc);
        this.imagesToDisplay = this.XML_db.SearchXMLColor(this.category,this.rgbToHex(color),storageDoc,num_Img);
        //this.gridView(canvas)
        this.circleView(canvas);


    }

    componentToHex(c) {
        let hex =parseInt(c, 16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    rgbToHex(c) {
        let r = c.split("(")[1].split(",")[0];
        let g = c.split("(")[1].split(",")[1];
        let b = c.split("(")[1].split(",")[2].split(")")[0];
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    countPixels(category){
        let num_pixel_Color = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        this.vermelho = num_pixel_Color[0];
        this.laranja = num_pixel_Color[1];
        this.amarelo = num_pixel_Color[2];
        this.verde = num_pixel_Color[3];
        this.verde_azulado = num_pixel_Color[4];
        this.azul = num_pixel_Color[5];
        this.roxo = num_pixel_Color[6];
        this.rosa = num_pixel_Color[7];
        this.branco = num_pixel_Color[8];
        this.cinzento = num_pixel_Color[9];
        this.preto = num_pixel_Color[10];
        this.castanho = num_pixel_Color[11];

        let arrayCat = category.data;

        for(let i = 0; i < arrayCat.length; i +=4){
            let r = arrayCat[i + 0];
            let g = arrayCat[i + 1];
            let b = arrayCat[i + 2];

            if (((Math.abs(204 - r) + Math.abs(0 - g) + Math.abs(0 - b))) && (Math.abs(204 - r) && (Math.abs(0 - g)) && ( Math.abs(0 - b))) ){
                // vermelho (204 0 0).
                this.vermelho++;

            }
            else if (((Math.abs(251 - r) + Math.abs(148 - g) + Math.abs(11 - b))) && (Math.abs(251 - r)) && (Math.abs(148 - g)) && (Math.abs(11 - b))) {
                // laranja (251 148 11)
                this.laranja++;
            }

            else if (((Math.abs(255 - r) + Math.abs(255 - g) + Math.abs(0 - b))) && (Math.abs(255 - r)) && (Math.abs(255 - g)) && ( Math.abs(0 - b))) {
                // amarelo (255 255 0).
                this.amarelo++;
            }
            else if (((Math.abs(0 - r) + Math.abs(204 - g) + Math.abs(0 - b))) && (Math.abs(0 - r)) && (Math.abs(204 - g)) && (Math.abs(0 - b))) {
                // verde (0 204 0).
                this.verde++;

            }
            else if (((Math.abs(3 - r) + Math.abs(192 - g) + Math.abs(198 - b))) && (Math.abs(3 - r)) && (Math.abs(192 - g)) && (Math.abs(198 - b))) {
                // verde-azulado (3 192 198)
                this.verde_azulado++;
            }
            else if (((Math.abs(0 - r) + Math.abs(0 - g) + Math.abs(255 - b))) && (Math.abs(0 - r)) && (Math.abs(0 - g)) && (Math.abs(255 - b))) {
                // azul (0 0 255).
                this.azul++;
            }
            else if (((Math.abs(118 - r) + Math.abs(44 - g) + Math.abs(167 - b))) && (Math.abs(118 - r)) && (Math.abs(44 - g)) && (Math.abs(167 - b))) {
                // roxo (118 44 167).
                this.roxo++;
            }
            else if (Math.abs(255 - r) + Math.abs(152 - g) + Math.abs(191 - b) && Math.abs(255 - r) && Math.abs(152 - g) < myError && Math.abs(191 - b)) {
                // rosa (255 152 191).
                this.rosa++;
            }
            else if (Math.abs(255 - r) + Math.abs(255 - g) + Math.abs(255 - b) && Math.abs(255 - r) && Math.abs(255 - g) && Math.abs(255 - b)) {
                // branco (255 255 255)
                this.branco++;
            }
            else if (Math.abs(153 - r) + Math.abs(153 - g) + Math.abs(153 - b) && Math.abs(153 - r) && Math.abs(153 - g) && Math.abs(153 - b)) {
                // cinzento ( 153 153 153).
                this.cinzento++;
            }
            else if (Math.abs(0 - r) + Math.abs(0 - g) + Math.abs(0 - b) && Math.abs(0 - r) && Math.abs(0 - g) && Math.abs(0 - b)) {
                // preto ( 0 0 0).
                this.preto++;

            }
            else if (Math.abs(136 - r) + Math.abs(84 - g) + Math.abs(24 - b) && Math.abs(136 - r)  && Math.abs(84 - g) && Math.abs(24 - b)) {
                // castanho ( 136 84 24).
                this.castanho++;

            }
        }
        num_pixel_Color = [this.vermelho, this.laranja, this.amarelo, this.verde, this.verde_azulado, this.azul, this.roxo, this.rosa, this.branco, this.cinzento, this.preto, this.castanho];
        return num_pixel_Color;
    }

    //Method to search images based on keywords
    searchKeywords(category){
        //let audio = document.getElementById("click");
        //audio.play();

        //validates category gets image's path calls the type of draw on canvas
        let canvas = document.querySelector("canvas");
        this.category = category;
        let catLength = this.categories.length;
        let invalido = true;
        for(let i = 0; i < catLength; i++){
            if (this.category == this.categories[i])
                invalido = false;
        }
        if (invalido)
            alert("Invalid Category");

        let xmlDoc = this.XML_db.loadXMLfile(this.XML_file);


        let num_Img = 100;

        this.imagesToDisplay = this.XML_db.SearchXML(this.category,xmlDoc,num_Img);
        // this.imagesToDisplay = this.XML_db.SearchXML(this.category,storageDoc,num_Img);
        //this.gridView(canvas)
        this.circleView(canvas);
        // this method should be completed by the students


    }

    //Method to search images based on Image similarities
    searchISimilarity(IExample, dist) {

        // this method should be completed by the students

    }

    //Method to compute the Manhattan difference between 2 images which is one way of measure the similarity
    //between images.
    calcManhattanDist(img1, img2){
        let manhattan = 0;

        for(let i=0; i < img1.color_moments.length; i++){
            manhattan += Math.abs(img1.color_moments[i] - img2.color_moments[i]);
        }
        manhattan /= img1.color_moments.length;
        return manhattan;
    }

    //Method to sort images according to the Manhattan distance measure
    sortbyManhattanDist(idxdist,list){

        // this method should be completed by the students
    }

    //Method to sort images according to the number of pixels of a selected color
    sortbyColor (idxColor, list) {
        list.sort(function (a, b) {
            return b.hist[idxColor] - a.hist[idxColor];
        });
    }

    //Method to visualize images in canvas organized in columns and rows
    gridView (canvas) {
        //applies algorithm for grid view and draws the images
        let px = 0;
        let py = 0;
        for (let i = 0; i < this.imagesToDisplay.length; i++){
            if (i % 5 === 0){
                px = 0;
                py += 100;
            }
            let img = new Picture(px, py, 200, 100, this.imagesToDisplay[i],document.getElementById("search").nodeValue);
            img.draw(canvas);
            px += 200;

        }        // this method should be completed by the students
    }
    circleView(canvas){
        //Clear canvas
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        //applies the circle algorithm and draws the images
        let x,y = 0;
        let N = 1;
        let NE = 2;
        let E = 3;
        let SE = 4;
        let S = 5;
        let SW = 6;
        let W = 7;
        let NW = 8;
        let py = 500;
        let px = 500;
        let w = 100;
        let h = 100;
        let largura = 100;
        let altura = 100;
        let circles = 1;
        let img = new Picture(px, py, w, h, this.imagesToDisplay[0], this.category);

        img.draw(canvas);
        for (let i = 1; i < this.imagesToDisplay.length; i++) {
            if(i === N){
                x = px;
                y = py -  250 * circles;

                largura = w - (25 * circles);
                altura =  h - (25 * circles);
                N += 8;
            }
            if(i === NE) {
                x = px + 200 * circles;
                y = py - 200 * circles;

                largura = w - (25 * circles);
                altura =  h - (25 * circles);
                NE += 8;
            }
            if(i === E) {
                x = px + 250 * circles;
                y = py;

                largura = w - (25 * circles);
                altura =  h - (25 * circles);
                E += 8;
            }
            if(i === SE) {
                x = px + 200 * circles;
                y = py + 200 * circles;

                largura = w - (25 * circles);
                altura =  h - (25 * circles);
                SE += 8;
            }
            if(i === S) {
                x = px;
                y = py + 250 * circles;

                largura = w - (25 * circles);
                altura =  h - (25 * circles);
                S += 8;
            }
            if (i === SW){
                x = px - 200 * circles;
                y = py + 200 * circles;

                largura = w - (25 * circles);
                altura =  h - (25 * circles);
                SW += 8;
            }
            if(i === W){
                x = px - 250 * circles;
                y = py;

                largura = w - (25 * circles);
                altura =  h - (25 * circles);
                W += 8;
            }
            if (i === NW){
                x = px - 200 * circles;
                y = py - 200 * circles;

                largura = w - (25 * circles);
                altura =  h - (25 * circles);
                NW += 8;
                circles += 0.5;
            }

            let img = new Picture(x, y, largura, altura, this.imagesToDisplay[i], document.getElementById("search").nodeValue);
            img.draw(canvas);

        }
    }

}


class Pool {
    constructor (maxSize) {
        this.size = maxSize;
        this.stuff = [];

    }

    insert (obj) {
        if (this.stuff.length < this.size) {
            this.stuff.push(obj);
        } else {
            alert("The application is full: there isn't more memory space to include objects");
        }
    }

    remove () {
        if (this.stuff.length !== 0) {
            this.stuff.pop();
        } else {
           alert("There aren't objects in the application to delete");
        }
    }

    empty_Pool () {
        while (this.stuff.length > 0) {
            this.remove();
        }
    }
}

