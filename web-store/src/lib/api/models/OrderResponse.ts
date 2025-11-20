/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderItemResponse } from './OrderItemResponse';
export type OrderResponse = {
    id: number;
    user_id: number;
    status: string;
    items?: Array<OrderItemResponse>;
};

