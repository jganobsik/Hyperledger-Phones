/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class PhoneContract extends Contract {

    async phoneExists(ctx, phoneId) {
        const buffer = await ctx.stub.getState(phoneId);
        return (!!buffer && buffer.length > 0);
    }

    async createPhone(ctx, phoneId, value) {
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
