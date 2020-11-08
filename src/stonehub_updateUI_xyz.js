// ==UserScript==
// @name         stonehub_updateUI_xyz
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  retrieve prices from idlescape.xyz and inject it in idlescape inventory
// @author       godi, weld, gamergeo, flo
// @match        https://idlescape.com/game*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// ==/UserScript==

class Stonehub_updateUI_xyz {

    constructor() {
        this.data_xyz = "";
        this.items_xyz = [];
        this.refresh_inventory_price = 1000;
    }

    error_handler(that, e) {
        let alert_msg = "Something goes wrong with Stonehub_updateUI_xyz ! \nError msg: " + e.message + "\nPlease reload the page or contact messenoire / Gamergeo";
        console.log(alert_msg);
        //alert(alert_msg);
    }

    start() {
        let that = this;
        setInterval(() => {
            try {
                that.refresh_xyz(that);
            } catch(e) {that.error_handler(that, e);}
        },  that.refresh_inventory_price);
    }
}


Stonehub_updateUI_xyz.prototype.refresh_xyz = function(that) {
    that.data_xyz = "";
    var item_list = document.getElementsByClassName("inventory-container-all-items")[0].childNodes[0];
    for (var i = 0; i < item_list.childElementCount; i++) {
        let next_element_sibling = item_list.childNodes[10+i].nextElementSibling;
        if(next_element_sibling){
            let node_value = next_element_sibling.attributes['data-for'].nodeValue;
            that.items_xyz.push([node_value.substring(7,node_value.indexOf("stockpile")),]);
        }
    }

    that.get_xyz_prices(that);
    for (i = 0; i < item_list.childElementCount; i++) {
        let next_element_sibling =  item_list.childNodes[10+i].nextElementSibling;
        if(next_element_sibling){
            next_element_sibling.childNodes[3].textContent = that.items_xyz[i][1] ? that.items_xyz[i][1].toString() : 'loading...';
            next_element_sibling.childNodes[3].style.color = "#54FF9F";
            next_element_sibling.childNodes[3].style.fontSize = "9px";
        }
    }
}

Stonehub_updateUI_xyz.prototype.get_xyz_prices = function(that) {
GM_xmlhttpRequest({
    url: "https://api.idlescape.xyz/prices",
    method: "GET",
    //         headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    onload: response => {
        that.data_xyz = JSON.parse(response.responseText)['items'];
        for (var i = 0; i < that.items_xyz.length; i++) {
            for (var j = 0; j < that.data_xyz.length; j++) {
                if (that.data_xyz[j]['name'] == that.items_xyz[i][0]) {
                    that.items_xyz[i][1]=that.data_xyz[j]['price'];
                    break;
                }
            }
        }
    }
});
}

let s = new Stonehub_updateUI_xyz(); s.start()