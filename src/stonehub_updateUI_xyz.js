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
        this.xyz_active_market_tag = "";
        this.xyz_refresh_rate = 2000;
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
    if (! document.getElementsByClassName("inventory-panel")[0]) {return;} // Inventory isn't being displayed => Leave
    that.xyz_inventory_HTML = document.getElementsByClassName("inventory-container-all-items")[0].children[0];
    for (var i = 0; i < that.xyz_inventory_HTML.childElementCount; i++) {
        let item_node = that.xyz_inventory_HTML.children[i];
        if(item_node){
            let node_value = item_node.attributes['data-for'].nodeValue;
            let item_name = ""
            if (node_value.includes("stockpile", 1)) {
                item_name = node_value.substring(7,node_value.indexOf("stockpile"));
            } else {
                item_name = node_value.substring(7,node_value.indexOf("vault"));
            }
            that.xyz_inventory_items.push([item_name,]);
        }
    }
}

Stonehub_updateUI_xyz.prototype.xyz_get_market_HTML = function(that) {
    that.xyz_market_HTML = "";
    that.xyz_market_items = [];
    that.xyz_active_market_tag = ""
    if (! document.getElementsByClassName("marketplace-content")[0]) {return;} // Market isn't open => Leave
    if (document.getElementsByClassName("marketplace-sell-items all-items")[0]) {
        // market is open on "Sell" tab
        that.xyz_active_market_tag = "marketplace-sell-items all-items";
    } else {
        // market is open on "Buy" tab
        that.xyz_active_market_tag = "marketplace-content";
    }
    if (that.xyz_active_market_tag=="marketplace-sell-items all-items") {
        // Since we're unable to read item names in sell tab, let's just copy the inventory list since it must be the same (tricky but should work), then leave
        that.xyz_market_HTML = document.getElementsByClassName(that.xyz_active_market_tag)[0];
        that.xyz_market_items = that.xyz_inventory_items;
        return;
    }
    that.xyz_market_HTML = document.getElementsByClassName(that.xyz_active_market_tag)[0].children[0];
    for (var i = 0; i < that.xyz_market_HTML.childElementCount; i++) {
        let current_item_node = that.xyz_market_HTML.children[i].children[0].children[0];
        if(current_item_node){
            let item_name = current_item_node.attributes['alt'].nodeValue;
            that.xyz_market_items.push([item_name,]);
        }
    }
}

Stonehub_updateUI_xyz.prototype.xyz_update_inventory_HTML = function(that) {
    // Create HTML div into the item node so we can display the price onto it
    for (var i = 0; i < that.xyz_inventory_items.length; i++) {
        let item_node = that.xyz_inventory_HTML.children[i];
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
            let value = that.xyz_inventory_items[i][1];
            item_node.getElementsByClassName("price").item(0).textContent = value ? value.toLocaleString() : 'no data...';
        }
    }
}

Stonehub_updateUI_xyz.prototype.xyz_update_market_HTML = function(that) {
    // Create HTML div into the item node so we can display the price onto it
    for (var i = 0; i < that.xyz_market_items.length; i++) {
        let item_node = that.xyz_market_HTML.children[i].children[0];
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
                if(that.xyz_active_market_tag == "marketplace-sell-items all-items"){
                    var enchantNode = item_node.getElementsByClassName("item-enchant").item(0);
                    enchantNode.style.position = "absolute";
                    enchantNode.style.top = "8px";
                    enchantNode.style.left = "0px";
                }
            }
            // Populate the div with xyz API current price
            let value = that.xyz_market_items[i][1];
            item_node.getElementsByClassName("price").item(0).textContent = value ? value.toLocaleString() : 'no data...';
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