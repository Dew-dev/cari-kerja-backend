/**
 * Base notification channel interface.
 * Future channels (SMS, Push, WhatsApp) implement the same contract.
 */
class Channel {
  /**
   * @returns {string}
   */
  get name() {
    throw new Error("Channel.name must be implemented");
  }

  /**
   * Whether this channel can deliver to the given user context.
   * @param {object} user
   * @returns {boolean}
   */
  canDeliver(_user) {
    return false;
  }

  /**
   * Enqueue delivery (must not block on external API).
   * @param {{ user: object, type: string, data: object, rendered: object }} payload
   */
  async send(_payload) {
    throw new Error("Channel.send must be implemented");
  }
}

module.exports = Channel;
