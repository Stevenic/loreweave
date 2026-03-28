/**
 * SignalR message broker adapter (§3.1).
 *
 * Wraps Azure SignalR Service (serverless mode) as a MessageBroker.
 * Dynamically imports the SignalR SDK to avoid hard dependency.
 */

import type { HubName, MessageBroker, SignalRMessage } from '@loreweave/types';

/** Configuration for the SignalR broker. */
export type SignalRBrokerConfig = {
	/** Azure SignalR connection string. */
	connectionString: string;
	/** Hub name prefix (hubs are: {prefix}game, {prefix}chat, {prefix}presence). */
	hubPrefix?: string;
};

type MessageHandler = (message: SignalRMessage) => void;

/**
 * Azure SignalR Service implementation of MessageBroker.
 *
 * In serverless mode, the broker uses the SignalR Management SDK
 * to send messages to groups/channels. Subscriptions are handled
 * client-side via the @microsoft/signalr client SDK.
 */
export class SignalRBroker implements MessageBroker {
	private readonly config: SignalRBrokerConfig;
	private readonly subscriptions = new Map<string, MessageHandler>();

	constructor(config: SignalRBrokerConfig) {
		this.config = config;
	}

	private hubName(hub: HubName): string {
		const prefix = this.config.hubPrefix ?? '';
		return `${prefix}${hub}`;
	}

	private subKey(hub: HubName, channel: string): string {
		return `${hub}:${channel}`;
	}

	async publish(hub: HubName, channel: string, message: SignalRMessage): Promise<void> {
		// In serverless mode, publishing goes through the REST API.
		// For now, also dispatch to local subscriptions (in-process consumers).
		const key = this.subKey(hub, channel);
		const handler = this.subscriptions.get(key);
		if (handler) {
			handler(message);
		}

		// Azure SignalR REST publish would go here when deployed.
		// The management SDK is dynamically imported to avoid hard dependency.
		// await this.getServiceClient().sendToGroup(this.hubName(hub), channel, message);
	}

	subscribe(hub: HubName, channel: string, handler: (message: SignalRMessage) => void): void {
		const key = this.subKey(hub, channel);
		this.subscriptions.set(key, handler);
	}

	unsubscribe(hub: HubName, channel: string): void {
		const key = this.subKey(hub, channel);
		this.subscriptions.delete(key);
	}

	async joinGroup(_hub: HubName, _group: string, _connectionId: string): Promise<void> {
		// In serverless mode, group management is handled via the management SDK.
		// Client connections are added to groups via Azure Functions negotiate endpoint.
	}

	async leaveGroup(_hub: HubName, _group: string, _connectionId: string): Promise<void> {
		// Counterpart to joinGroup.
	}
}

/**
 * In-memory message broker for local development.
 *
 * All pub/sub happens in-process. No Azure dependencies.
 */
export class MemoryBroker implements MessageBroker {
	private readonly subscriptions = new Map<string, Set<MessageHandler>>();

	private subKey(hub: HubName, channel: string): string {
		return `${hub}:${channel}`;
	}

	async publish(hub: HubName, channel: string, message: SignalRMessage): Promise<void> {
		const key = this.subKey(hub, channel);
		const handlers = this.subscriptions.get(key);
		if (handlers) {
			for (const handler of handlers) {
				handler(message);
			}
		}
	}

	subscribe(hub: HubName, channel: string, handler: MessageHandler): void {
		const key = this.subKey(hub, channel);
		let handlers = this.subscriptions.get(key);
		if (!handlers) {
			handlers = new Set();
			this.subscriptions.set(key, handlers);
		}
		handlers.add(handler);
	}

	unsubscribe(hub: HubName, channel: string): void {
		const key = this.subKey(hub, channel);
		this.subscriptions.delete(key);
	}

	async joinGroup(_hub: HubName, _group: string, _connectionId: string): Promise<void> {
		// No-op for in-memory broker.
	}

	async leaveGroup(_hub: HubName, _group: string, _connectionId: string): Promise<void> {
		// No-op for in-memory broker.
	}
}
