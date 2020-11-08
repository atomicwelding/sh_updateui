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
        this.xyz_inventory_HTML = "";
        this.xyz_market_HTML = "";
        this.xyz_inventory_items = [];
        this.xyz_market_items = [];
        this.xyz_refresh_rate = 5000;
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
                that.xyz_main(that);
            } catch(e) {that.error_handler(that, e);}
        }, that.xyz_refresh_rate);
    }
}


Stonehub_updateUI_xyz.prototype.xyz_main = function(that) {
    // This function is called every "xyz_refresh_rate" seconds and refreshes price according to items displayed on screen
    that.xyz_get_inventory_HTML(that);
    that.xyz_get_market_HTML(that);
    if(that.xyz_inventory_items.length > 0 || that.xyz_market_items.length > 0) that.xyz_get_prices(that);
}

Stonehub_updateUI_xyz.prototype.xyz_get_inventory_HTML = function(that) {
    that.xyz_inventory_HTML = "";
    that.xyz_inventory_items = [];
    if(document.getElementsByClassName("inventory-container-all-items").length==0) return; // Leave if inventory isn't being displayed
    that.xyz_inventory_HTML = document.getElementsByClassName("inventory-container-all-items")[0].childNodes[0];
    for (var i = 0; i < that.xyz_inventory_HTML.childElementCount; i++) {
        let item_node = that.xyz_inventory_HTML.childNodes[12+i];
        if(item_node){
            let node_value = item_node.attributes['data-for'].nodeValue;
            let item_name = node_value.substring(7,node_value.indexOf("stockpile"));
            that.xyz_inventory_items.push([item_name,]);
        }
    }
}

Stonehub_updateUI_xyz.prototype.xyz_get_market_HTML = function(that) {
    that.xyz_market_HTML = "";
    that.xyz_market_items = [];
    if(document.getElementsByClassName("marketplace-content").length==0) return; // Leave if market isn't being displayed
    that.xyz_market_HTML = document.getElementsByClassName("marketplace-content")[0].childNodes[0];
    for (var i = 0; i < that.xyz_market_HTML.childElementCount; i++) {
        let current_item_node = that.xyz_market_HTML.childNodes[i].childNodes[0].childNodes[0];
        if(current_item_node){
            let item_name = current_item_node.attributes['alt'].nodeValue;
            that.xyz_market_items.push([item_name,]);
        }
    }
}

Stonehub_updateUI_xyz.prototype.xyz_update_inventory_HTML = function(that) {
    // Create HTML div into the item node so we can display the price onto it
    for (var i = 0; i < that.xyz_inventory_items.length; i++) {
        let item_node = that.xyz_inventory_HTML.childNodes[i+12];
        if(item_node){
            if(item_node.getElementsByClassName("price").length==0){
                // If the div was not created yet, create it with adapted CSS style and also move down the enchant icon
                var newNode = document.createElement("div");
                newNode.className = "price";
                newNode.style.position = "absolute";
                newNode.style.top = "-4px";
                newNode.style.left = "1px";
                newNode.style.color = "#54FF9F";
                newNode.style.fontSize = "9px";
                var lastNode = item_node.lastElementNode;
                item_node.insertBefore(newNode, lastNode);
                var enchantNode = item_node.getElementsByClassName("item-enchant").item(0);
                enchantNode.style.position = "absolute";
                enchantNode.style.top = "8px";
                enchantNode.style.left = "0px";
            }
            // Populate the div with xyz API current price
            item_node.getElementsByClassName("price").item(0).textContent = that.xyz_inventory_items[i][1] ? that.xyz_inventory_items[i][1].toString() : 'loading...';
        }
    }
}

Stonehub_updateUI_xyz.prototype.xyz_update_market_HTML = function(that) {
    // Create HTML div into the item node so we can display the price onto it
    for (var i = 0; i < that.xyz_market_items.length; i++) {
        let item_node = that.xyz_market_HTML.childNodes[i].childNodes[0];
        if(item_node){
            if(item_node.getElementsByClassName("price").length==0){
                // If the div was not created yet, create it with adapted CSS style and also move down the enchant icon
                var newNode = document.createElement("div");
                newNode.className = "price";
                newNode.style.position = "absolute";
                newNode.style.top = "-4px";
                newNode.style.left = "1px";
                newNode.style.color = "#54FF9F";
                newNode.style.fontSize = "9px";
                var lastNode = item_node.lastElementNode;
                item_node.insertBefore(newNode, lastNode);
            }
            // Populate the div with xyz API current price
            item_node.getElementsByClassName("price").item(0).textContent = that.xyz_market_items[i][1] ? that.xyz_market_items[i][1].toString() : 'loading...';
        }
    }
}

Stonehub_updateUI_xyz.prototype.xyz_get_prices = function(that) {
    // xhr request to scrape idlescape.xyz prices in JSON format
    // xhr request is asynchronous as for now (synchronous = true not working, neither callback apparently), and so HTML edits must happen inside the onload event for now
    GM_xmlhttpRequest({
        url: "https://api.idlescape.xyz/prices",
        method: "GET",
        onload: response => {
            var xyz_data = JSON.parse(response.responseText)['items'];
            // Get price for each item in inventory
            for (var i = 0; i < that.xyz_inventory_items.length; i++) {
                for (var j = 0; j < xyz_data.length; j++) {
                    if (xyz_data[j]['name'] == that.xyz_inventory_items[i][0]) {
                        that.xyz_inventory_items[i][1]=xyz_data[j]['price'];
                        break;
                    }
                }
            }
            if(that.xyz_inventory_items.length > 0) that.xyz_update_inventory_HTML(that);
            // Get price for each item in inventory
            for (i = 0; i < that.xyz_market_items.length; i++) {
                for (j = 0; j < xyz_data.length; j++) {
                    if (xyz_data[j]['name'] == that.xyz_market_items[i][0]) {
                        that.xyz_market_items[i][1]=xyz_data[j]['price'];
                        break;
                    }
                }
            }
            if(that.xyz_market_items.length > 0) that.xyz_update_market_HTML(that);
        }
    });
}

let s = new Stonehub_updateUI_xyz(); s.start()