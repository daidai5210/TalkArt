/**
 * @module drawing-tools/tool-definitions
 * OpenAI-compatible tool definitions for the TalkArt drawing tools.
 *
 * These definitions describe all 15 tool functions to the LLM
 * in the format required by the OpenAI Chat Completions API (function calling).
 * The LLM uses these schemas to decide which tool to call and with what arguments.
 *
 * Tool categories:
 * - 6 basic shape drawing tools (drawCircle, drawRect, drawEllipse, drawLine, drawText, drawTriangle)
 * - 6 element operation tools (selectElement, updateElement, deleteElement, moveElement, scaleElement, duplicateElement)
 * - 3 canvas operation tools (clearCanvas, undoAction, exportImage)
 *
 * Each tool definition includes:
 * - A descriptive name that the LLM can reference
 * - A Chinese description explaining when and how to use the tool
 * - A JSON Schema `parameters` object describing the expected arguments
 * - Enum values for semantic parameters
 * - Default value hints in descriptions
 */

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/**
 * All 15 tool definitions for the TalkArt drawing tools.
 * Pass this array to the LLM API via the `tools` parameter.
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 6 Basic Shape Drawing Tools
  // ═══════════════════════════════════════════════════════════════════

  {
    type: 'function' as const,
    function: {
      name: 'drawCircle',
      description: '在画布上画一个圆形。当用户想画圆、圈、圆形、球、点等圆形物体时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'object',
            description: '圆形的位置',
            properties: {
              semantic: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
                description: '语义位置，如"中间"、"左上角"等。默认为 center（居中）',
              },
              x: { type: 'number', description: '精确 x 坐标（像素）' },
              y: { type: 'number', description: '精确 y 坐标（像素）' },
            },
          },
          r: { type: 'number', description: '半径（像素），默认 100' },
          size: {
            type: 'object',
            description: '语义大小',
            properties: {
              semantic: {
                type: 'string',
                enum: ['small', 'medium', 'large'],
                description: '语义大小：small=半径50, medium=半径100, large=半径150。默认 medium',
              },
            },
          },
          style: {
            type: 'object',
            description: '圆形的样式',
            properties: {
              fill: { type: 'string', description: '填充颜色，支持中文颜色名如"红色"、"蓝色"或CSS颜色如"#FF0000"。默认紫色' },
              stroke: { type: 'string', description: '边框颜色，默认 none（无边框）' },
              strokeWidth: { type: 'number', description: '边框宽度（像素），默认 0' },
            },
          },
        },
        required: ['position'],
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'drawRect',
      description: '在画布上画一个矩形。当用户想画矩形、长方形、正方形、方块等矩形物体时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'object',
            description: '矩形的位置',
            properties: {
              semantic: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
                description: '语义位置，默认 center（居中）',
              },
              x: { type: 'number', description: '精确 x 坐标（像素）' },
              y: { type: 'number', description: '精确 y 坐标（像素）' },
            },
          },
          size: {
            type: 'object',
            description: '矩形的大小',
            properties: {
              semantic: {
                type: 'string',
                enum: ['small', 'medium', 'large'],
                description: '语义大小：small=100x100, medium=200x200, large=300x300。默认 medium',
              },
              width: { type: 'number', description: '精确宽度（像素）' },
              height: { type: 'number', description: '精确高度（像素）' },
            },
          },
          style: {
            type: 'object',
            description: '矩形的样式',
            properties: {
              fill: { type: 'string', description: '填充颜色，支持中文颜色名或CSS颜色。默认紫色' },
              stroke: { type: 'string', description: '边框颜色，默认 none' },
              strokeWidth: { type: 'number', description: '边框宽度（像素），默认 0' },
              cornerRadius: { type: 'number', description: '圆角半径（像素），默认 0（直角）' },
            },
          },
        },
        required: ['position', 'size'],
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'drawEllipse',
      description: '在画布上画一个椭圆。当用户想画椭圆、椭圆形物体时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'object',
            description: '椭圆的位置',
            properties: {
              semantic: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
                description: '语义位置，默认 center（居中）',
              },
              x: { type: 'number', description: '精确 x 坐标（像素）' },
              y: { type: 'number', description: '精确 y 坐标（像素）' },
            },
          },
          rx: { type: 'number', description: '水平半径（像素），默认 120' },
          ry: { type: 'number', description: '垂直半径（像素），默认 80' },
          size: {
            type: 'object',
            description: '语义大小（当 rx/ry 未指定时使用）',
            properties: {
              semantic: {
                type: 'string',
                enum: ['small', 'medium', 'large'],
                description: '语义大小，默认 medium',
              },
            },
          },
          style: {
            type: 'object',
            description: '椭圆的样式',
            properties: {
              fill: { type: 'string', description: '填充颜色，支持中文颜色名或CSS颜色。默认紫色' },
              stroke: { type: 'string', description: '边框颜色，默认 none' },
              strokeWidth: { type: 'number', description: '边框宽度（像素），默认 0' },
            },
          },
        },
        required: ['position'],
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'drawLine',
      description: '在画布上画一条直线。当用户想画线、直线、连接线时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          start: {
            type: 'object',
            description: '起点位置',
            properties: {
              semantic: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
                description: '起点的语义位置，默认 left（左侧中间）',
              },
              x: { type: 'number', description: '起点精确 x 坐标（像素）' },
              y: { type: 'number', description: '起点精确 y 坐标（像素）' },
            },
          },
          end: {
            type: 'object',
            description: '终点位置',
            properties: {
              semantic: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
                description: '终点的语义位置，默认 right（右侧中间）',
              },
              x: { type: 'number', description: '终点精确 x 坐标（像素）' },
              y: { type: 'number', description: '终点精确 y 坐标（像素）' },
            },
          },
          stroke: { type: 'string', description: '线条颜色，支持中文颜色名或CSS颜色。默认白色' },
          strokeWidth: { type: 'number', description: '线条宽度（像素），默认 2' },
        },
        required: ['start', 'end'],
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'drawText',
      description: '在画布上添加文字。当用户想写字、添加文字、标注文字时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'object',
            description: '文字的位置',
            properties: {
              semantic: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
                description: '语义位置，默认 center（居中）',
              },
              x: { type: 'number', description: '精确 x 坐标（像素）' },
              y: { type: 'number', description: '精确 y 坐标（像素）' },
            },
          },
          text: { type: 'string', description: '要显示的文字内容（必填）' },
          fontSize: { type: 'number', description: '字体大小（像素），默认 24' },
          fontFamily: { type: 'string', description: '字体族，如 "sans-serif"、"serif"，默认 sans-serif' },
          fill: { type: 'string', description: '文字颜色，支持中文颜色名或CSS颜色。默认白色' },
        },
        required: ['position', 'text'],
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'drawTriangle',
      description: '在画布上画一个三角形。当用户想画三角形、三角、金字塔形时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          position: {
            type: 'object',
            description: '三角形的位置',
            properties: {
              semantic: {
                type: 'string',
                enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'],
                description: '语义位置，默认 center（居中）',
              },
              x: { type: 'number', description: '精确 x 坐标（像素）' },
              y: { type: 'number', description: '精确 y 坐标（像素）' },
            },
          },
          size: {
            type: 'object',
            description: '三角形的大小',
            properties: {
              semantic: {
                type: 'string',
                enum: ['small', 'medium', 'large'],
                description: '语义大小：small=100x100, medium=200x200, large=300x300。默认 medium',
              },
              width: { type: 'number', description: '精确宽度（像素）' },
              height: { type: 'number', description: '精确高度（像素）' },
            },
          },
          style: {
            type: 'object',
            description: '三角形的样式',
            properties: {
              fill: { type: 'string', description: '填充颜色，支持中文颜色名或CSS颜色。默认紫色' },
              stroke: { type: 'string', description: '边框颜色，默认 none' },
              strokeWidth: { type: 'number', description: '边框宽度（像素），默认 0' },
            },
          },
        },
        required: ['position'],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6 Element Operation Tools
  // ═══════════════════════════════════════════════════════════════════

  {
    type: 'function' as const,
    function: {
      name: 'selectElement',
      description: '选择画布上的一个元素。当用户想选中某个元素进行后续操作时使用此工具。可以通过ID或描述（如"那个圆"、"蓝色的矩形"）来选择元素。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '元素的ID。如果已知元素ID，直接提供' },
          description: { type: 'string', description: '元素的中文描述，如"那个圆"、"蓝色的矩形"、"三角形"。系统会根据类型和颜色匹配最相似的元素' },
        },
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'updateElement',
      description: '更新元素的属性。当用户想修改元素的颜色、边框、大小等属性时使用此工具。需要先选中元素或提供元素ID。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '元素ID。如果未提供，则使用当前选中的元素' },
          properties: {
            type: 'object',
            description: '要更新的属性键值对',
            properties: {
              fill: { type: 'string', description: '新的填充颜色，支持中文颜色名或CSS颜色' },
              stroke: { type: 'string', description: '新的边框颜色' },
              strokeWidth: { type: 'number', description: '新的边框宽度（像素）' },
              x: { type: 'number', description: '新的 x 坐标（像素），适用于矩形、文字' },
              y: { type: 'number', description: '新的 y 坐标（像素），适用于矩形、文字' },
              cx: { type: 'number', description: '新的中心 x 坐标（像素），适用于圆形、椭圆' },
              cy: { type: 'number', description: '新的中心 y 坐标（像素），适用于圆形、椭圆' },
              r: { type: 'number', description: '新的半径（像素），适用于圆形' },
              rx: { type: 'number', description: '新的水平半径（像素），适用于椭圆' },
              ry: { type: 'number', description: '新的垂直半径（像素），适用于椭圆' },
              width: { type: 'number', description: '新的宽度（像素），适用于矩形' },
              height: { type: 'number', description: '新的高度（像素），适用于矩形' },
              fontSize: { type: 'number', description: '新的字体大小（像素），适用于文字' },
              text: { type: 'string', description: '新的文字内容，适用于文字元素' },
              cornerRadius: { type: 'number', description: '新的圆角半径（像素），适用于矩形' },
            },
          },
        },
        required: ['properties'],
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'deleteElement',
      description: '删除画布上的一个元素。当用户想删除、移除某个元素时使用此工具。需要先选中元素或提供元素ID。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要删除的元素ID。如果未提供，则删除当前选中的元素' },
        },
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'moveElement',
      description: '移动画布上的元素。当用户想移动、挪动元素位置时使用此工具。支持精确偏移（dx/dy像素）或语义方向（如"左边"、"右边"、"上面"、"下面"，每次移动50像素）。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要移动的元素ID。如果未提供，则移动当前选中的元素' },
          dx: { type: 'number', description: '水平偏移量（像素），正数向右，负数向左' },
          dy: { type: 'number', description: '垂直偏移量（像素），正数向下，负数向上' },
          direction: {
            type: 'string',
            enum: ['左边', '左', '左面', '右边', '右', '右面', '上面', '上', '下面', '下'],
            description: '语义移动方向，每次移动50像素。"左边"=向左50px，"右边"=向右50px，"上面"=向上50px，"下面"=向下50px',
          },
        },
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'scaleElement',
      description: '缩放画布上的元素。当用户想放大、缩小元素时使用此工具。支持精确缩放因子（如1.2=放大20%，0.8=缩小20%）或语义缩放（如"大一点"→1.2倍，"小一点"→0.8倍，"两倍"→2倍，"一半"→0.5倍）。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要缩放的元素ID。如果未提供，则缩放当前选中的元素' },
          scale: { type: 'number', description: '缩放因子，如1.2=放大20%，0.8=缩小20%，2.0=两倍大' },
          semantic: {
            type: 'string',
            enum: ['大一点', '大一些', '更大', '小一点', '小一些', '更小', '两倍', '两倍大', '一半', '一半大'],
            description: '语义缩放："大一点"→1.2倍，"大一些"→1.2倍，"更大"→1.5倍，"小一点"→0.8倍，"小一些"→0.8倍，"更小"→0.5倍，"两倍"→2倍，"一半"→0.5倍',
          },
        },
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'duplicateElement',
      description: '复制画布上的元素。当用户想复制、克隆某个元素时使用此工具。复制后的元素会偏移30像素放置。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要复制的元素ID。如果未提供，则复制当前选中的元素' },
          dx: { type: 'number', description: '复制元素的水平偏移量（像素），默认 30' },
          dy: { type: 'number', description: '复制元素的垂直偏移量（像素），默认 30' },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3 Canvas Operation Tools
  // ═══════════════════════════════════════════════════════════════════

  {
    type: 'function' as const,
    function: {
      name: 'clearCanvas',
      description: '清空画布上的所有元素。当用户想清空画布、重新开始、清除所有内容时使用此工具。',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'undoAction',
      description: '撤销上一步操作。当用户想撤销、回退上一次操作时使用此工具。',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  {
    type: 'function' as const,
    function: {
      name: 'exportImage',
      description: '导出画布为图片文件。当用户想保存、导出、下载画布内容时使用此工具。支持SVG和PNG两种格式。',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['svg', 'png'],
            description: '导出格式：svg（矢量图）或 png（位图）。默认 svg',
          },
          filename: {
            type: 'string',
            description: '导出文件名（不含扩展名），默认 "talkart-export"',
          },
        },
      },
    },
  },
];

/**
 * Type helper: extract the function name from a tool definition.
 * Useful for type-safe tool dispatch.
 */
export type ToolName = (typeof TOOL_DEFINITIONS)[number]['function']['name'];
