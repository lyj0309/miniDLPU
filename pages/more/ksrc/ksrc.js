// pages/more/ksrc/ksrc.js
//获取应用实例
const app = getApp();
let rewardedVideoAd = null;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        hiddenmodalput: true,
        isLoading: false,
        name: "",
        room: "",
        time: "",
        id: "",
        cc: "",
        ident: "",
        num: 0,
        index: 0,
        array: [{
            name: "",
            room: "",
            time: "",
            id: "",
            cc: "",
            ident: ""
        }, ],
    },
    onReady: function() {
        var that = this;
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this;
        //主题更新
        that.setData({
            theme: app.getTheme(),
            theEverydayCount: wx.getStorageSync("theEverydayCount"),
            theEverydayUsed: wx.getStorageSync("theEverydayUsed")
        });
        //刷新本地账号
        var Id = wx.getStorageSync("userid");
        var Pwd = wx.getStorageSync("userpwd");
        var Server = wx.getStorageSync("server");
        //获取本地数据
        that.getDataLocal();

        //标题显示剩余次数
        wx.setNavigationBarTitle({
            title: '考试日程-余额'+(that.data.theEverydayCount-that.data.theEverydayUsed)+'次',
        })

        //视频广告
        if (wx.createRewardedVideoAd) {
            rewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: 'adunit-cfdf2f4bd499a89d'
            })
            rewardedVideoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
            })
            rewardedVideoAd.onError((err) => {
                console.log('onError event emit', err)
            })
            rewardedVideoAd.onClose((res) => {
                // 用户点击了【关闭广告】按钮
                if (res && res.isEnded) {
                    wx.setStorageSync("theEverydayCount", parseInt(wx.getStorageSync("theEverydayCount")) + app.globalData.countIncreseByAD);
                    that.refreshKSRC();
                } else {
                    // 播放中途退出，不下发游戏奖励
                }
            })
        }
    },
    onShow: function() {
        let that = this;
        //主题更新
        that.setData({
            theme: app.getTheme()
        });
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {
        return {
            title: '工大教务处-考试查询',
            desc: '可查详细的课程表、详细成绩，更多查询功能欢迎体验！',
            path: '/pages/more/ksrc/ksrc'
        };
    },
    //更新数据
    getDataSyn: function () {
        var that = this;
        that.refreshKSRC();
        //标题更新剩余次数
        that.setData({
            theEverydayCount: wx.getStorageSync("theEverydayCount"),
            theEverydayUsed: wx.getStorageSync("theEverydayUsed")
        });
        wx.setNavigationBarTitle({
            title: '考试日程-余额'+(that.data.theEverydayCount-that.data.theEverydayUsed)+'次',
        })
    },
    getDataLocal: function (item) {
        var that = this;
        wx.showLoading({
            title: '玩命加载中...',
            mask: true
        })
        wx.getStorage({
            key: 'localDataKsrc',
            success: function (res) {
                console.log(res)
                //本地有数据
                if (!!res.data.ksarr) {
                    that.setData({
                        array: res.data.ksarr,
                        num: res.data.num
                    });
                    wx.hideLoading();
                } else {
                    // console.log("本地无数据")
                    wx.hideLoading();
                    // 本地无数据
                    that.refreshKSRC();
                }
            },
            fail: function (res) {
                wx.hideLoading();
                wx.showToast({
                    title: '正在更新',
                    duration: 1500
                })
                // 本地无数据
                that.refreshKSRC();
            }
        })
    },
    //考试日程刷新
    refreshKSRC: function() {
        var that = this;
        if (!app.delCount()) {
            wx.showModal({
                content: '您当前查询次数剩余量为0，请等待' + (app.globalData.countIncreseFre / 3600).toFixed(2) + '小时 后再试！服务器资源有限，请理解。您可在设置中查询今日总额度以及剩余额度，还可以赚取额外次数！完整观看广告，可立即+' + app.globalData.countIncreseByAD + '次！',
                showCancel: true,
                title: "查询次数已耗尽",
                confirmText: "观看广告",
                confirmColor: that.data.theme.color[that.data.theme.themeColorId].value,
                success: function(res) {
                    if (res.confirm) {
                        console.log('打开激励视频');
                        // 在合适的位置打开广告
                        if (rewardedVideoAd) {
                            rewardedVideoAd.show()
                                .then(() => console.log('激励视频 广告显示'))
                                .catch(() => {
                                    rewardedVideoAd.load()
                                        .then(() => rewardedVideoAd.show())
                                        .catch(err => {
                                            console.log('激励视频 广告显示失败')
                                        })
                                })
                        }
                    }
                }
            });
            return;
        }
        //更新按钮禁用
        that.setData({
            isLoading: true
        });
        // 显示顶部刷新图标
        wx.showNavigationBarLoading();
        //刷新本地账号
        var Id = wx.getStorageSync("userid");
        var Pwd = wx.getStorageSync("userpwd");
        var Server = wx.getStorageSync("server");
        that.requestKSRC(Id, Pwd, Server);
        // 隐藏顶部刷新图标
        wx.hideNavigationBarLoading();
    },
    //考试日程请求单独作为一个方法
    requestKSRC: function(Id, Pwd, Server) {
        wx.showLoading({
            title: '数据获取中...',
            mask: false
        })
        var that = this;
        if (Id == '' && Pwd == '') {
            wx.showModal({
                content: '缓存里没有你的学号和密码，请点击:“设置”>“学号和密码”',
                showCancel: true,
                confirmText: "立即前往",
                confirmColor: that.data.theme.color[that.data.theme.themeColorId].value,
                success: function(res) {
                    if (res.confirm) {
                        console.log('用户点击确定');
                        // 隐藏顶部刷新图标
                        wx.hideNavigationBarLoading();
                        wx.navigateTo({
                            url: '../../setting-detail/set-userinfo',
                        })
                    }
                }
            });
            return;
        }
        if (Id == null) {
            return;
        }
        var localDataKsrc = wx.getStorageSync('localDataKsrc');
        if (!!!localDataKsrc) localDataKsrc = {};

        Pwd = encodeURIComponent(Pwd); //转义，防止有特殊字符如：&
        var WannaKey = app.encryptUserKey(Id, Pwd);
        var reurl = wx.getStorageSync('myserver');
        // var reurl = "https://test.1zdz.cn";
        console.log("当前请求服务器：" + reurl);
        wx.request({
            url: reurl + '/api/ksrc.php',
            method: 'POST',
            data: {
                XiangGanMa: WannaKey,
                server: Server
            },
            header: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            success: function(res) {
                wx.hideLoading();
                console.log(res);
                if (res.statusCode == 200 && res.data.data != null) {
                    wx.showToast({
                        title: '获取成功！',
                        duration: 1000
                    })
                    var change = [];
                    for (var i = 0; i < res.data.data.length; i++) {
                        change[i] = new Object();
                        change[i].name = that.isOver16(res.data.data[i].name);
                        change[i].room = res.data.data[i].room;
                        change[i].cc = res.data.data[i].cc;
                        change[i].time = res.data.data[i].time;
                        change[i].ident = res.data.data[i].ident;
                        change[i].id = res.data.data[i].id;
                    }
                    // console.log(change);
                    that.setData({
                        array: change,
                        num: res.data.data.length,
                    });
                    //更新本地数据
                    localDataKsrc = { ksarr: change, num: res.data.data.length }
                    wx.setStorageSync('localDataKsrc', localDataKsrc)
                } else if (res.statusCode == 200 && res.data.state == "error") {
                    wx.showModal({
                        content: '登陆教务处失败！可能当前服务器暂时被ban了，更换一台试试？也可能是学号或者密码错了喔',
                        showCancel: true,
                        confirmText: "前往切换",
                        confirmColor: that.data.theme.color[that.data.theme.themeColorId].value,
                        success: function(res) {
                            if (res.confirm) {
                                console.log('用户点击确定');
                                wx.navigateTo({
                                    url: '../../setting-detail/set-server',
                                })
                            }
                        }
                    });
                } else if(res.statusCode != 200 ){
                    wx.showModal({
                        title: '服务器故障',
                        content: '很遗憾，当前服务器暂时不可用，请通知管理员处理 [Error:' + res.statusCode + ']',
                        showCancel: false,
                        confirmText: "确定",
                        confirmColor: that.data.theme.color[that.data.theme.themeColorId].value
                    });
                }
            },
            fail: function(res) {
                wx.hideLoading();
                wx.showToast({
                    title: '获取失败！',
                    duration: 1000
                });
                // 隐藏顶部刷新图标
                wx.hideNavigationBarLoading();
            },
            complete: function(res) {
                // 隐藏顶部刷新图标
                wx.hideNavigationBarLoading();
                //更新按钮恢复
                that.setData({
                    isLoading: false
                });
            }
        });
        // 隐藏顶部刷新图标
        wx.hideNavigationBarLoading();
    },
    isOver16: function(str) {
        if (str.length > 16) {
            return str.substring(0, 15) + "...";
        } else return str;
    },
    isOver11: function(str) {
        if (str.length > 11) {
            return str.substring(0, 10) + "...";
        } else return str;
    },
    showdetail: function(e) {
        console.log(e);
        var that = this;
        var noshow = false;
        var name = e.currentTarget.dataset.name;
        var room = e.currentTarget.dataset.room;
        var time = e.currentTarget.dataset.time;
        var cc = e.currentTarget.dataset.cc;
        var id = e.currentTarget.dataset.id;
        var ident = e.currentTarget.dataset.ident;
        if (name == "") noshow = true;
        that.setData({
            hiddenmodalput: noshow,
            name: name,
            room: room,
            cc: cc,
            time: time,
            id: id,
            ident: ident
        })
    },
    confirm: function() {
        this.setData({
            hiddenmodalput: true
        })
    }
})