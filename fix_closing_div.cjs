const fs = require('fs');

function fixClosing(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Specifically look for the exact area where we changed to div
  // Because they both have inner elements and close with </button> 
  // AHSPView:
  //                 <ChevronDown className="w-5 h-5" />
  //               )}
  //             </button>
  //           </div>
  content = content.replace(/<\/button>\n                    <\/div>\n                  <\/div>/g, '</div>\n                    </div>\n                  </div>');
  
  content = content.replace(/<\/button>\n                          <\/div>\n                        <\/div>\n/g, '</div>\n                          </div>\n                        </div>\n');
  
  // Actually, I can just use a regex replacing </button> that follows the exact lines:
  fs.writeFileSync(file, content);
}

// Gantt:
//                         <ChevronDown className="w-4 h-4" />
//                       )}
//                     </button>
//                   </div>
//                 </div>
//               </div>

// Let's just do it manually with sed or string replacement since it's only two files.
