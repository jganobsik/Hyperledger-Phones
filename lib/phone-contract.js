/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

const phoneStatus = {
    Created: {code: 1, text: 'Phone Created'},
    Shipped: {code: 2, text: 'Phone Shipped'},
    Delivered: {code: 3, text: 'Phone Delivered'},
    Sold: {code: 4, text: 'Phone Sold'},
    Returned: {code: 5, text: 'Phone Returned'}
};

class PhoneContract extends Contract {

    async RegisterManufacturer(ctx, mfrId, companyName) {
        let Manufacturer = {
            id: mfrId,
            companyName: companyName,
            type: 'Manufacturer',
            devices: []
        };
        await ctx.stub.putState(mfrId, Buffer.from(JSON.stringify(Manufacturer)));
        //add mfrId to 'Manufacturers' key
        let data = await ctx.stub.getState('Manufacturers');
        if (data) {
            let manufacturers = JSON.parse(data.toString());
            manufacturers.push(mfrId);
            await ctx.stub.putState('Manufacturers', Buffer.from(JSON.stringify(manufacturers)));
        } else {
            throw new Error('Manufacturers not found');
        }
        // return manufacturer object
        return JSON.stringify(Manufacturer);
    }
    async RegisterRetailer(ctx, rtlId, companyName) {
        let Retailer = {
            id: rtlId,
            companyName: companyName,
            type: 'Retailer',
            devices: []
        };
        await ctx.stub.putState(rtlId, Buffer.from(JSON.stringify(Retailer)));
        //add mfrId to 'Manufacturers' key
        let data = await ctx.stub.getState('Retailers');
        if (data) {
            let retailers = JSON.parse(data.toString());
            retailers.push(rtlId);
            await ctx.stub.putState('Retailers', Buffer.from(JSON.stringify(retailers)));
        } else {
            throw new Error('retailers not found');
        }
        // return manufacturer object
        return JSON.stringify(Retailer);
    }


    async RegisterCarrier(ctx, carId, companyName) {
        let Carrier = {
            id: carId,
            companyName: companyName,
            type: 'Carrier',
            devices: []
        };
        await ctx.stub.putState(carId, Buffer.from(JSON.stringify(Carrier)));
        //add mfrId to 'Manufacturers' key
        let data = await ctx.stub.getState('Carriers');
        if (data) {
            let carriers = JSON.parse(data.toString());
            carriers.push(carId);
            await ctx.stub.putState('Carriers', Buffer.from(JSON.stringify(carriers)));
        } else {
            throw new Error('Carriers not found');
        }
        // return manufacturer object
        return JSON.stringify(Carrier);
    }

    async phoneExists(ctx, phoneId) {
        const buffer = await ctx.stub.getState(phoneId);
        return (!!buffer && buffer.length > 0);
    }

    async createPhone(ctx, phoneId, mfrId, price) {
        const exists = await this.phoneExists(ctx, phoneId);
        let phone = {
            id: phoneId,
            status: JSON.stringify(phoneStatus.Created),
            price: price,
            manufacturer: mfrId,
            retailerId: null,
            carrierId: null,
            customerId: null
        };
        if (exists) {
            throw new Error(`The phone ${phoneId} already exists`);
        }
        const buffer = Buffer.from(JSON.stringify(phone));
        let mfrData = await ctx.stub.getState(mfrId);
        let mfr;
        if (mfrData) {
            mfr = JSON.parse(mfrData.toString());
            if (mfr.type !== 'Manufacturer') {
                throw new Error('Manufacturer not identified');
            }
        } else {
            throw new Error('Manufacturer not found');
        }
        mfr.devices.push(phoneId);
        await ctx.stub.putState(phoneId, buffer);
    }

    async readPhone(ctx, phoneId) {
        const exists = await this.phoneExists(ctx, phoneId);
        if (!exists) {
            throw new Error(`The phone ${phoneId} does not exist`);
        }
        const buffer = await ctx.stub.getState(phoneId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }
    async shipPhone(ctx, phoneId) {
        const exists = await this.phoneExists(ctx, phoneId);
        if (!exists) {
            throw new Error(`The phone ${phoneId} does not exist`);
        }
        let phone = this.readPhone(ctx, phoneId);
        if (phone) {
            if (phone.status === JSON.stringify(phoneStatus.Created)) {
                phone.status = JSON.stringify(phoneStatus.Shipped);
            }
        }
    }

    async logPhone(ctx, phoneId, rtlId) {
        const exists = await this.phoneExists(ctx, phoneId);
        if (!exists) {
            throw new Error(`The phone ${phoneId} does not exist`);
        }
        let phone = this.readPhone(ctx, phoneId);
        let retailerData = await ctx.stub.getState(rtlId);
        let retailer;
        if (retailerData) {
            retailer = JSON.parse(retailerData.toString());
            if (retailer.type !== 'Retailer') {
                throw new Error('retailer not identified');
            }
        } else {
            throw new Error('retailer not found');
        }
        if (phone) {
            if (phone.status === JSON.stringify(phoneStatus.Shipped) && retailer) {
                phone.status = JSON.stringify(phoneStatus.Delivered);
                phone.retailerId = rtlId;
                retailer.devices.push(phoneId);
            }
        }
    }

    async sellPhone(ctx, phoneId, carId, customerId) {
        const exists = await this.phoneExists(ctx, phoneId);
        if (!exists) {
            throw new Error(`The phone ${phoneId} does not exist`);
        }
        let phone = this.readPhone(ctx, phoneId);
        let carrierData = await ctx.stub.getState(carId);
        let carrier;
        if (carrierData) {
            carrier = JSON.parse(carrierData.toString());
            if (carrier.type !== 'Carrier') {
                throw new Error('carrier not identified');
            }
        } else {
            throw new Error('carrier not found');
        }
        if (phone) {
            if (phone.status === JSON.stringify(phoneStatus.Delivered) && carrier) {
                phone.status = JSON.stringify(phoneStatus.Sold);
                phone.carrierId = carId;
                phone.customerId = customerId;
                carrier.devices.push(phoneId);
            }
        }
    }

    async deletePhone(ctx, phoneId) {
        const exists = await this.phoneExists(ctx, phoneId);
        if (!exists) {
            throw new Error(`The phone ${phoneId} does not exist`);
        }
        await ctx.stub.deleteState(phoneId);
    }

}

module.exports = PhoneContract;
