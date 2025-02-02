package com.gmixrreact;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import cl.json.RNSharePackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.mg.app.PickerPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.github.yamill.orientation.OrientationPackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.aigegou.blur.BlurImageViewPackage;
import com.cmcewen.blurview.BlurViewPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.remobile.marqueeLabel.RCTMarqueeLabelPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNDeviceInfo(),
            new RNSharePackage(),
            new PickerPackage(),
            new PickerPackage(),
            new VectorIconsPackage(),
            new OrientationPackage(this),
            new RNFetchBlobPackage(),
            new BlurImageViewPackage(),
            new BlurViewPackage(),
            new BackgroundTimerPackage(),
            new RCTMarqueeLabelPackage()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
