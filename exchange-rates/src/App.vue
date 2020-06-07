<template>
  <div id="app">
    <div class="layout">
      <el-container>
        <el-main>
          <h3>当前数据源：{{ this.dataSource }}</h3>
          <el-row>
            <el-col :span="12" :offset="6">
              <el-table
              v-loading="loading"
              :data="tableData"
              class="tb-edit" 
              :border="true"
              size="small"
              stripe
              highlight-current-row 
              style="width: 100%">
              <el-table-column
                label="币种"
                prop="name"
                >
              </el-table-column>
              <el-table-column label="金额">
                <template scope="scope">
                    <el-input size="small" v-model="scope.row.value" placeholder="请输入内容" @change="handleEdit(scope.$index, scope.row)" ></el-input>
                    <span>{{scope.row.value}}</span>
                </template>
              </el-table-column>
            </el-table>
            </el-col>
          </el-row>
          
          <el-row  style="padding-top: 20px;">
            <el-col :span="24" style="display: flex; justify-content: flex-end; padding: 0 20px;">
              <el-popover
                placement="top-start"
                width="100"
                trigger="hover"
                content="获取最新汇率数据">
                <el-button size="small" @click="getRateData" slot="reference" icon="el-icon-refresh" circle></el-button>
              </el-popover>
              <el-popover
                placement="top-start"
                width="30"
                trigger="hover"
                content="设置">
                <el-button size="small" slot="reference" @click="showSettingModal" icon="el-icon-s-tools" circle></el-button>
              </el-popover>
            </el-col>
          </el-row>
        </el-main>
      </el-container>

      <el-dialog title="设置" :visible.sync="settingFormVisible">
        <el-form :model="form">
          <el-form-item label="选择数据来源" label-width="124px">
            <el-radio-group v-model="form.dataSource">
              <el-radio label="ExchangeRates"></el-radio>
              <el-radio label="聚合数据"></el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="聚合数据APP KEY" label-width="140px" v-if="form.dataSource != 'ExchangeRates'">
            <el-input v-model="form.juheAppKey" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="价格类型" label-width="140px" v-if="form.dataSource != 'ExchangeRates'">
            <el-select v-model="form.juheDataType" placeholder="请选择">
              <el-option
                v-for="item in juhePriceType"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="保留小数位" label-width="140px">
            <el-input-number v-model="form.digit" :min="0" :max="10"></el-input-number>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="settingFormVisible = false">取 消</el-button>
          <el-button type="primary" @click="confirmSettingForm">确 定</el-button>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
const axios = require('axios');

export default {
  name: 'App',
  data() {
    return {
      juheAppKey: '',
      juheApi: 'http://web.juhe.cn:8080/finance/exchange/rmbquot?key=',
      exchangeRateApi: 'https://api.exchangeratesapi.io/latest?base=USD',
      rates: {
        CNY: 0,
        USD: 0,
        GBP: 0,
        EUR: 0,
        AUD: 0,
        CAD: 0,
        HKD: 0,
        THB: 0,
        KRW: 0,
        MOP: 0,
        JPY: 0,
        TWD: 0,
      },
      currencies: [
        {
          name: '人民币(CNY)',
          key: 'CNY',
          keywords: ['人民币', 'CNY', '¥', '￥'],
        }, {
          name: '美元(USD)',
          key: 'USD',
          keywords: ['美元', '美金', 'USD', '$'],
        }, {
          name: '英镑(GBP)',
          key: 'GBP',
          keywords: ['英镑', 'GBP', '£'],
        }, {
          name: '欧元(EUR)',
          key: 'EUR',
          keywords: ['欧元', 'EUR', '€'],
        }, {
          name: '澳元(AUD)',
          key: 'AUD',
          keywords: ['澳元', '澳大利亚元', 'AUD', 'A$'],
        }, {
          name: '加元(CAD)',
          key: 'CAD',
          keywords: ['加元', '加拿大元', 'CAD', 'C$'],
        }, {
          name: '港币(HKD)',
          key: 'HKD',
          keywords: ['港币', '港元', 'HKD', 'HK$'],
        }, {
          name: '泰铢(THB)',
          key: 'THB',
          keywords: ['泰铢', '泰国铢', 'THB', '฿'],
        }, {
          name: '韩元(KRW)',
          key: 'KRW',
          keywords: ['韩元', 'KRW', '₩', '韩国元'],
        }, {
          name: '日元(JPY)',
          key: 'JPY',
          keywords: ['日元', 'JPY', 'J'],
        }
      ],
      juhePriceType: [
        {
          label: '现汇买入价',
          value: 'fBuyPri',
        }, {
          label: '现钞买入价',
          value: 'mBuyPri',
        }, {
          label: '现汇卖出价',
          value: 'fSellPri',
        }, {
          label: '现钞卖出价',
          value: 'mSellPri',
        }, {
          label: '银行折算价/中间价',
          value: 'bankConversionPri',
        }
      ],
      loading:  false,
      dataSource: 'ExchangeRates', // 或者是聚合；
      amount: 1,
      currency: 'CNY', 
      juheDataType: 'bankConversionPri',
      settingFormVisible: false,
      digit: 2,
      form: {
        dataSource: 'ExchangeRates',
        juheAppKey: '',
        digit: 2,
        juheDataType: 'bankConversionPri',
      },
    };
  },
  computed: {
    tableData: function() {
      return this.currencies.map(c => {
        const obj = {};
        obj.name = c.name;
        obj.value = this.format45(this.amount / this.rates[this.currency] * this.rates[c.key], this.digit);
        return obj;
      });
    },
  },
  created() {
    // 获取数据源设定
    this.dataSource = localStorage.getItem("dataSource") || 'ExchangeRates';
    this.juheAppKey = localStorage.getItem('juheAppKey');
    this.juheDataType = localStorage.getItem('juheDataType') || 'bankConversionPri';
    this.form.dataSource = '聚合数据';
    this.form.juheAppKey = this.juheAppKey;
    this.form.juheDataType = this.juheDataType;

    // 获取小数位设定
    this.digit = localStorage.getItem('digit') || 2;
    this.form.digit = this.digit;
    this.getInitialRate();
    
  },
  mounted() {
    /* global utools */
    utools.onPluginReady(() => {
      utools.setSubInput(({ text } )=> this.subIptChange(text), '输入币种金额');
    });
    utools.onPluginEnter(({ payload }) => {
      console.log(payload);
      this.subIptChange(payload);
    });
    
  },
  methods: {
    // 子输入框输入数值处理
    subIptChange: function(text) {
      const re = /^(人民币|CNY|¥|￥|美元|美金|USD|\$|英镑|GBP|£|欧元|EUR|€|澳元|澳大利亚元|AUD|A\$|加元|加拿大元|CAD|C\$|港币|港元|HKD|HK|泰铢|泰国铢|THB|฿|韩元|KRW|₩|日元|JPY|J){1}\d+(\.\d+)?/i;
      if (re.test(text)) {
        const numIdx = text.search(/\d+(\.\d+)?/i);
        const currency = text.slice(0, numIdx);
        const num = parseFloat(text.slice(numIdx));
        for (const cType of this.currencies) {
          if (cType.keywords.includes(currency.toUpperCase())) {
            this.currency = cType.key;
            this.amount = num;
            break;
          }
        }
      }
    },
    getInitialRate: function() { // 初始化汇率
      const rates = localStorage.getItem("rates");
      const lastModifyDate = localStorage.getItem("lastModifyDate");
      if (!rates || this.getDate() != lastModifyDate) {
        this.getRateData();
      } else {
        this.rates = JSON.parse(rates);
      }
    },
    // 获取汇率数据
    getRateData: function() {
      this.loading = true;
      if (this.dataSource == 'ExchangeRates') {
        this.getExchangeRateData();
      } else {
        this.getJuheData();
      }
    },

    // 获取exChangeRate的数据
    getExchangeRateData: function() {
      axios.get(this.exchangeRateApi)
        .then(res => {
          const rates = res.data.rates;
          this.rates = rates;
          this.saveData();
          this.loading = false;
        });
    },

    // 获取聚合数据
    getJuheData: function() {
      var that = this;
      const url = `${that.juheApi}${that.juheAppKey}`;
      axios.get(url)
        .then(res => {
          if (res.data.resultcode == '200') {
            const data = res.data.result[0];
            Object.keys(data).map(rate => {
              for (const cType of that.currencies) {
                const value = data[rate];
                if (cType.keywords.includes(value.name)) {
                  const price = parseFloat(value[that.juheDataType]);
                  if (price != 0) {
                    that.rates[cType.key] = 100 / price;
                  }
                  
                  break;
                }
              }
            });
            that.rates.CNY = 1;
            this.saveData();
            this.loading = false;
          } else {
            that.$alert(`可能是聚合API KEY错误，无法获取数据，错误代码：${res.data.resultcode}`, '提示', {
              confirmButtonText: '确定',
              callback: action => {
                that.$message({
                  type: 'info',
                  message: `action: ${ action }`
                });
              }
            });
          }
        });
    },

    // 保存数据
    saveData: function() {
      localStorage.setItem('rates', JSON.stringify(this.rates));
      localStorage.setItem('lastModifyDate', this.getDate());
    },

    // 获取当前日期
    getDate: function() {
      const now = new Date();
      return `${now.getFullYear()}/${now.getMonth()}/${now.getDate()}`;
    },


    handleEdit(index, row) {
      this.amount = row.value;  
      this.currency = this.currencies[index].key;
    },

    showSettingModal: function() {
      this.settingFormVisible = true;
    },

    confirmSettingForm: function() {
      const that = this;
      if (that.form.dataSource == '聚合数据' && that.form.juheAppKey.trim().length <= 0) {
        that.$alert('选择聚合数据源后请输入聚合API', '提示', {
          confirmButtonText: '确定',
          callback: action => {
            that.$message({
              type: 'info',
              message: `action: ${ action }`
            });
          }
        });
      } else {
        that.dataSource = that.form.dataSource,
        that.juheAppKey = that.form.juheAppKey;
        that.digit = that.form.digit;
        that.juheDataType = that.form.juheDataType;
        localStorage.setItem('dataSource', that.dataSource);
        localStorage.setItem('juheAppKey', that.juheAppKey);
        localStorage.setItem('digit', that.digit);
        localStorage.setItem('juheDataType', that.juheDataType);
        that.settingFormVisible = false;
        that.getRateData();
      }
    },

    /// 四舍五入
    /// @params val 需要处理的数值
    /// @params  digit 保留的小鼠位数
    format45(val, digit) {
      const v2 = Math.pow(10, digit);
      if (isNaN(val) || val == undefined || val == null) { return null; }
      return Math.round(val * v2) / v2;
    }

  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
html, body, #app, .layout {
  height: 100%;
}
body {
  overflow: hidden;
  margin: 0;
  padding: 0;
}
.tb-edit .el-input {
  display: none
}
.tb-edit .current-row .el-input {
    display: block
}
.tb-edit .current-row .el-input+span {
    display: none
}
.el-main {
  padding: 0;
}
</style>
