import { AppState, AppStateStatus, NativeModules } from 'react-native';
import {
  AppOpenAdEvent,
  FullScreenAdInterface,
  HandlerType,
  RequestOptions,
} from 'src/types';

import MobileAd from './MobileAd';

const { requestAd, presentAd } =
  NativeModules.RNAdMobAppOpen as FullScreenAdInterface;

export default class AppOpenAd extends MobileAd<AppOpenAdEvent, HandlerType> {
  private constructor(unitId: string) {
    super('AppOpen', 0, unitId);
  }

  private currentAppState: AppStateStatus = 'unknown';

  private handleAppStateChange = (state: AppStateStatus) => {
    if (this.currentAppState === 'background' && state === 'active') {
      presentAd(this.requestId);
    }
    this.currentAppState = state;
  };

  private static sharedInstance: AppOpenAd;

  private static checkInstance() {
    if (!this.sharedInstance) {
      throw new Error('AppOpenAd is not created.');
    }
  }

  /**
   * Creates a AppOpenAd instance. You can create AppOpenAd only once in your app. Ad is loaded automatically after created and dismissed.
   * @param unitId The Ad Unit ID for the App Open Ad. You can find this on your Google AdMob dashboard.
   * @param showOnColdStart Whether to show App Open Ad on app cold start. Defaults to `false`. See {@link https://developers.google.com/admob/android/app-open-ads#coldstart}
   * @param requestOptions Optional RequestOptions used to load the ad.
   */
  static createAd(
    unitId: string,
    showOnColdStart = false,
    requestOptions?: RequestOptions
  ) {
    if (this.sharedInstance) {
      throw new Error('You already created AppOpenAd once.');
    }

    this.sharedInstance = new AppOpenAd(unitId);
    this.sharedInstance.setRequestOptions(requestOptions);
    this.sharedInstance.addEventListener('adDismissed', () => {
      this.load();
    });

    this.load().then(() => {
      if (showOnColdStart) {
        this.show();
      }
    });

    AppState.addEventListener(
      'change',
      this.sharedInstance.handleAppStateChange
    );
  }

  /**
   * Loads a new App Open ad.
   * @param requestOptions Optional RequestOptions used to load the ad.
   */
  static load(requestOptions?: RequestOptions) {
    this.checkInstance();
    return requestAd(
      this.sharedInstance.requestId,
      this.sharedInstance.unitId,
      requestOptions || this.sharedInstance.requestOptions
    );
  }

  /**
   * Shows loaded App Open Ad.
   */
  static show() {
    this.checkInstance();
    return presentAd(this.sharedInstance.requestId);
  }

  /**
   * Sets RequestOptions for this Ad instance.
   * @param requestOptions RequestOptions used to load the ad.
   */
  static setRequestOptions(requestOptions?: RequestOptions) {
    this.checkInstance();
    return this.sharedInstance.setRequestOptions(requestOptions);
  }

  /**
   * Adds an event handler for an ad event.
   * @param event Event name
   * @param handler Event handler
   */
  static addEventListener(event: AppOpenAdEvent, handler: HandlerType) {
    this.checkInstance();
    return this.sharedInstance.addEventListener(event, handler);
  }

  /**
   * Removes an event handler.
   * @param handler Event handler to remove
   */
  static removeEventListener(handler: HandlerType) {
    this.checkInstance();
    return this.sharedInstance.removeEventListener(handler);
  }

  /**
   * Removes all registered event handlers for this ad.
   */
  static removeAllListeners() {
    this.checkInstance();
    return this.sharedInstance.removeAllListeners();
  }
}
