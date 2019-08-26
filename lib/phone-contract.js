/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
// import fabric api
const { Contract } = require('fabric-contract-api');
// set phone status codes
const phoneStatus = {
    Created: {code: 1, text: 'Phone Created'},
    Shipped: {code: 2, text: 'Phone Shipped'},
    Delivered: {code: 3, text: 'Phone Delivered'},
    Sold: {code: 4, text: 'Phone Sold'},
    Returned: {code: 5, text: 'Phone Returned'}
};

class PhoneContract extends Contract {
    //instantiate list of participants
    async instantiate(ctx) {

        let emptyList = [];
        await ctx.stub.putState('Manufacturers', Buffer.from(JSON.stringify(emptyList)));
        await ctx.stub.putState('Retailers', Buffer.from(JSON.stringify(emptyList)));
        await ctx.stub.putState('Carriers', Buffer.from(JSON.stringify(emptyList)));
    }
    // register a new manufacturer
    async registerManufacturer(ctx, mfrId, companyName) {
        // manufacturer object
        let Manufacturer = {
            id: mfrId,
            companyName: companyName,
            type: 'Manufacturer',
            devices: []
        };
        //add data to ledger
        await ctx.stub.putState(mfrId, Buffer.from(JSON.stringify(Manufacturer)));
        //get manufacturers from ledger
        let data = await ctx.stub.getState('Manufacturers');
        //check response
        if (data) {
            //parse response into list of manufacturers
            let manufacturers = JSON.parse(data.toString());
            //add this manufacturers' id to list
            manufacturers.push(mfrId);
            //update list on ledger
            await ctx.stub.putState('Manufacturers', Buffer.from(JSON.stringify(manufacturers)));
        } else {
            throw new Error('Manufacturers not found');
        }
        // return newly added manufacturer object
        return JSON.stringify(Manufacturer);
    }
    //register a new retailer
    async registerRetailer(ctx, rtlId, companyName) {
        // retailer object
        let Retailer = {
            id: rtlId,
            companyName: companyName,
            type: 'Retailer',
            devices: []
        };
        //add data to ledger
        await ctx.stub.putState(rtlId, Buffer.from(JSON.stringify(Retailer)));
        //get retailers from ledger
        let data = await ctx.stub.getState('Retailers');
        //check response
        if (data) {
            //parse list of retailers
            let retailers = JSON.parse(data.toString());
            //add current retailer id to list
            retailers.push(rtlId);
            //update list on ledger
            await ctx.stub.putState('Retailers', Buffer.from(JSON.stringify(retailers)));
        }
        // return retailer object
        return JSON.stringify(Retailer);
    }
    //register a new carrier
    async registerCarrier(ctx, carId, companyName) {
        //carrier object
        let Carrier = {
            id: carId,
            companyName: companyName,
            type: 'Carrier',
            devices: []
        };
        //update ledger
        await ctx.stub.putState(carId, Buffer.from(JSON.stringify(Carrier)));
        //get list of carriers from ledger
        let data = await ctx.stub.getState('Carriers');
        // check response
        if (data) {
            // parse response into list of carriers
            let carriers = JSON.parse(data.toString());
            //add current carrier to list
            carriers.push(carId);
            //update list of carriers on ledger
            await ctx.stub.putState('Carriers', Buffer.from(JSON.stringify(carriers)));
        }
        // return carrier object
        return JSON.stringify(Carrier);
    }
    //check if phone exists
    async itemExists(ctx, phoneId) {
        const buffer = await ctx.stub.getState(phoneId);
        return (!!buffer && buffer.length > 0);
    }
    //create phone
    async createPhone(ctx, phoneId, mfrId, model, price) {
        //check if phone already exists
        const exists = await this.itemExists(ctx, phoneId);
        if (exists) {
            throw new Error(`An item with id ${phoneId} already exists`);
        }
        //phone object
        let phone = {
            id: phoneId,
            status: JSON.stringify(phoneStatus.Created),
            price: price,
            manufacturer: mfrId,
            model: model,
            retailerId: null,
            carrierId: null,
            customerId: null
        };
        //get data from ledger
        const buffer = Buffer.from(JSON.stringify(phone));
        //check to see if manufacturer exists
        let mfrData = this.readItem(mfrId);
        let mfr;
        if (mfrData) {
            //parse manufacturer object from ledger
            mfr = JSON.parse(mfrData.toString());
            //ensure object is correct type
            if (mfr.type !== 'Manufacturer') {
                throw new Error(`Item with ID ${mfrId} is not a Manufacturer`);
            }
        }
        //add phone to manufacturer's devices
        mfr.devices.push(phoneId);
        //update manufacturer object on ledger
        await ctx.stub.putState(mfrId, Buffer.from(JSON.stringify(mfr)));
        //update ledger with new phone
        await ctx.stub.putState(phoneId, buffer);
        //return phone
        return JSON.stringify(phone);
    }
    //get phone data
    async readItem(ctx, id) {
        //check if phone exists
        const exists = await this.itemExists(ctx, id);
        if (!exists) {
            throw new Error(`No item with id ${id} exists`);
        }
        //get data from ledger
        const buffer = await ctx.stub.getState(id);
        //parse response into phone object
        const item = JSON.parse(buffer.toString());
        //return phone object
        return item;
    }
    //update phone status to shipped
    async shipPhone(ctx, phoneId) {
        //get phone object
        let phone = this.readItem(ctx, phoneId);
        if (phone) {
            //ensure phone currently has Created status
            if (phone.status === JSON.stringify(phoneStatus.Created)) {
                //update status to Shipped
                phone.status = JSON.stringify(phoneStatus.Shipped);
            }
        }
    }
    //add phone to retailer inventory
    async logPhone(ctx, phoneId, rtlId) {
        //get phone object
        let phone = this.readItem(ctx, phoneId);
        //get retailer
        let retailerData = this.readItem(rtlId);
        let retailer;
        if (retailerData) {
            //create retailer object
            retailer = JSON.parse(retailerData.toString());
            //ensure company is retailer
            if (retailer.type !== 'Retailer') {
                throw new Error(`Item with ID ${rtlId} is not a Retailer`);
            }
        }
        if (phone) {
            //check phone status and retailer
            if (phone.status === JSON.stringify(phoneStatus.Shipped) && retailer) {
                //update phone status
                phone.status = JSON.stringify(phoneStatus.Delivered);
                //update phone object with retailer id
                phone.retailerId = rtlId;
                //add phone to retailer inventory
                retailer.devices.push(phoneId);
                //update retailer object on ledger
                await ctx.stub.putState(rtlId, Buffer.from(JSON.stringify(retailer)));
                //update phone on ledger
                await ctx.stub.putState(phoneId, Buffer.from(JSON.stringify(phone)));
            }
        }
    }

    async sellPhone(ctx, phoneId, carId, customerId) {
        //get phone object
        let phone = this.readItem(ctx, phoneId);
        //get carrier info from ledger
        let carrierData = this.readItem(carId);
        let carrier;
        if (carrierData) {
            //parse ledger response into carrier object
            carrier = JSON.parse(carrierData.toString());
            //ensure company is a carrier
            if (carrier.type !== 'Carrier') {
                throw new Error(`Item with ID ${carId} is not a Carrrier`);
            }
        }
        if (phone) {
            //check phone status and carrier object
            if (phone.status === JSON.stringify(phoneStatus.Delivered) && carrier) {
                //update phone status
                phone.status = JSON.stringify(phoneStatus.Sold);
                //update phone object with carrier id
                phone.carrierId = carId;
                //update phone object with customer id
                phone.customerId = customerId;
                //add phone to customer object
                carrier.devices.push(phoneId);
                //update carrier on ledger
                await ctx.stub.putState(carId, Buffer.from(JSON.stringify(carrier)));
                //update phone on ledger
                await ctx.stub.putState(phoneId, Buffer.from(JSON.stringify(phone)));
            }
        }
    }
    //return a defective phone
    async returnPhone(ctx, phoneId) {
        //get phone object
        let phone = this.readItem(ctx, phoneId);
        if (phone) {
            // ensure phone was sold
            if (phone.status === JSON.stringify(phoneStatus.Sold)) {
                //update status to returned
                phone.status = JSON.stringify(phoneStatus.Returned);
                //update phone on ledger
                await ctx.stub.putState(phoneId, Buffer.from(JSON.stringify(phone)));
            }
        }
    }
    //delete phone from ledger
    async deletePhone(ctx, phoneId) {
        const exists = await this.itemExists(ctx, phoneId);
        if (!exists) {
            throw new Error(`The phone ${phoneId} does not exist`);
        }
        await ctx.stub.deleteState(phoneId);
    }
}

module.exports = PhoneContract;
