var H = Highcharts
var cbsas = Highcharts.geojson(Highcharts.maps['countries/us/cbsa'])
var states = Highcharts.geojson(Highcharts.maps['countries/us/states'])

var sheetID = '1BXVPZXA_R1ejffXIgnOTJrGbK5VbgZERCB0maL1hdNE'
var range = 'Sheet3!A:I'

var chart_title = 'Homeownership Affordability Varies Across the Country'
var chart_subtitle = 'Recently sold homes with monthly payments affordable <br/>to the following median-income households:'
var legend_title = 'Share Affordable<br/> (Percent)'

var table_notes = 'Notes: Median incomes are estimated at the core-based statistical area (CBSA) level. Recently sold homes are defined as homes with owners that moved within the 12 months prior to the survey date. Monthly payments assume a 3.5% downpayment and property taxes of 1.15%, property insurance of 0.35%, and mortgage insurance of 0.85%. Affordable payments are defined as requiring less than 31% of monthly household income. Only CBSAs with at least 30 home sales in the past year are shown. <br/> Source: JCHS tabulations of US Census Bureau, 2017 American Community Survey 1-Year Estimates, and Freddie Mac, PMMS.'

var hhd_type = 'All Households'

var export_filename = "Homeownership Affordability - Harvard JCHS - State of the Nation's Housing 2019"

var default_selection = 2

var categories = [],
    ref_data = [],
    selected_data = [],
    chart_options = {},
    chart = {},
    drilldown_chart = {}

/*~~~~~~~ Document ready function ~~~~~~~*/
$(document).ready(function() {
  //get Google sheet data
  $.get(H.JCHS.requestURL(sheetID, range), function(obj) {
    categories = obj.values[0]
    ref_data = obj.values.slice(1)

    //create the title, notes, and search box
    //$('#chart_title').html(chart_title) //Disabling for use on website, where the title is in the page, making this title redundant (but not the subtitle, hence keeping that)
    $('#chart_subtitle').html(chart_subtitle)
    $('#table_notes').html(table_notes)

    H.JCHS.createSearchBox(ref_data, searchCallback, '', 1, 'search', 'Need help finding a metro? Search here...') //5th argument (the 1) tells the search box to list column index 1 from ref_data, instead of the default 0 (in this case metro name, not GEOID)

    //create the chart
    createChart()

  })
}) //end document.ready


function createChart() {

  selected_data = ref_data.map(function (x) {
    return [x[0], x[default_selection]] //return data in 2 columns, GEOID and the value to be mapped

  })

  /*~~~~~~~ Chart Options ~~~~~~~*/
  chart_options = {
    JCHS: {
      //drilldownFunction: drilldownChart
    },
    chart: {
      events: {
        load: function() {
          initUserInteraction()
        },
      },
    },

    legend: {
        title: {
          text: legend_title
        },
      x: -20,
      y: -20
    },

    colorAxis: {
      dataClasses: [
        { to: 25 },
        { from: 25, to: 50 },
        { from: 50, to: 75 },
        { from: 75 }
      ]
    },
    series: [
      {
        type: 'map',
        name: categories[default_selection],
        mapData: cbsas,
        data: selected_data
      }, {
        type: 'mapline',
        name: 'State borders',
        data: states
      }
    ], //end series


    // Exporting options
    exporting: {
      filename: export_filename,
      JCHS: { sheetID: sheetID },
      chartOptions: {
        chart: {
          marginBottom: 75 //may have to adjust to fit all of the notes
        },
        title: { text: chart_title + ' - <br/>' + hhd_type},
        subtitle: { text: table_notes,
                  y: -35},
        legend: {
          y: -60, //may have to adjust to fit all of the notes
          x: -5
        }
      },
      buttons: {
        contextButton: {
        menuItems: ['viewFullDataset', 'separator', 'downloadPDF', 'separator', 'downloadPNG', 'downloadJPEG']
        } //end contextButtons
      } //end buttons
    }, //end exporting

    tooltip: {
      formatter: function() {
        var point = this.point
        var series = this.series
        var user_selection = $('#user_input :checked').val()

        var tooltip_text = ''
        tooltip_text +=  '<b>' +  point.name + '</b>'

        ref_data.forEach(function (row) {
          if (row[0] == point.GEOID) {
            switch (user_selection) {
              case '2':
                tooltip_text +=  '<br><i>' + 'All Households' + '</i>'
                tooltip_text +=  '<br><br>Share of Homes Affordable to Median-Income Households: <b>' + H.JCHS.numFormat(point.value, 1) + '%</b>'
                tooltip_text += '<br>Median Household Income: <b>$' + H.JCHS.numFormat(row[6]) + '</b>'
                break
              case '3':
                tooltip_text +=  '<br><i>' + 'Homeowner Households' + '</i>'
                tooltip_text +=  '<br><br>Share of Homes Affordable to Median-Income Homeowners: <b>' + H.JCHS.numFormat(point.value, 1) + '%</b>'
                tooltip_text += '<br>Median Homeowner Income: <b>$' + H.JCHS.numFormat(row[7]) + '</b>'
                break
              case '4':
                tooltip_text +=  '<br><i>' + 'Renter Households' + '</i>'
                tooltip_text +=  '<br><br>Share of Homes Affordable to Median-Income Renters: <b>' + H.JCHS.numFormat(point.value, 1) + '%</b>'
                tooltip_text += '<br>Median Renter Income: <b>$' + H.JCHS.numFormat(row[8]) + '</b>'
                break
            }
          }
        })

        return tooltip_text

      }
    }
  } //end chart_options

  /*~~~~~~~ Create Chart ~~~~~~~*/
  chart = Highcharts.mapChart(
    'container',
    chart_options
  ) //end chart

} //end createChart()

/*~~~~~~~~~~~~~~ User interaction ~~~~~~~~~~~~~~~~~~~*/
function initUserInteraction () {
  $('#user_input').on('change', function () {
    var new_col = parseInt($('#user_input :checked').val())
    var new_data = ref_data.map(function (x) {
      return [x[0], x[new_col]]
    })
    chart.series[0].update({name: categories[new_col]})
    chart.series[0].setData(new_data)
    //Need an if/elseif/else loop to update the name of the hhd_type
    if($('#user_input :checked').val() == '2'){
      hhd_type = 'All Households'
    } else if ($('#user_input :checked').val() == '3') {
      hhd_type = 'Homeowner Households'
    } else {
      hhd_type = 'Renter Households'
    }
    chart.exporting.update({chartOptions: {
      title: { text: chart_title + ' - <br/>' + hhd_type},
    }})
  })
}

function searchCallback (metro_name) {
  H.JCHS.mapLocatorCircle(chart, metro_name)
}
