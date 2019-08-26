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
            await ctx.stub.putState('manufacturers', Buffer.from(JSON.stringify(manufacturers)));
        } else {
            throw new Error('manufacturers not found');
        }
        // return manufacturer object
        return JSON.stringify(Manufacturer);
    }

    async phoneExists(ctx, phoneId) {
        const buffer = await ctx.stub.getState(phoneId);
        return (!!buffer && buffer.length > 0);
    }

    async createPhone(ctx, phoneId, mfrId, value) {
        const exists = await this.phoneExists(ctx, phoneId);
        if (exists) {
            throw new Error(`The phone ${phoneId} already exists`);
        }
        const asset = { value };
        const buffer = Buffer.from(JSON.stringify(asset));
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
    async readManufacturer(ctx, phoneId){
        const exists = await this.phoneExists(ctx, phoneId);
        if (!exists) {
            throw new Error(`The phone ${phoneId} does not exist`);
        }
        const buffer = await ctx.stub.getState(phoneId);
        const asset = JSON.parse(buffer.toString());
        return asset.mfrId;
    }
    async updatePhone(ctx, phoneId, newValue) {
        const exists = await this.phoneExists(ctx, phoneId);
        if (!exists) {
            throw new Error(`The phone ${phoneId} does not exist`);
        }
        const asset = { value: newValue };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(phoneId, buffer);
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
